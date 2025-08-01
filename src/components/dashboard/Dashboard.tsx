import React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Users, FileText, Clock, Send } from "lucide-react";
import { useAppData } from "@/hooks/useAppData";
import { usePermissions } from "@/hooks/usePermissions";
import { Link } from "react-router-dom";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CreateTrial } from "@/components/onboarding/CreateTrial";
import { useOnboardingMutations } from "@/hooks/useOnboardingMutations";
import { useState } from "react";
import { InviteMemberDialog } from "@/components/organization/InviteMemberDialog.tsx";
import { Groq } from "groq-sdk";
import { supabase } from "@/integrations/supabase/client";

// Enhanced Markdown renderer for artifacts
const ArtifactRenderer = ({ content }: { content: string }) => {
  const lines = content.split("\n");
  const tableRows: string[][] = [];
  let isInTable = false;
  let tableHeaders: string[] = [];

  // First pass: identify tables
  const processedContent: Array<{ type: string; content: any; index: number }> =
    [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Headers
    if (line.startsWith("## ")) {
      processedContent.push({
        type: "header",
        content: line.replace("## ", ""),
        index: i,
      });
    }
    // Table detection
    else if (line.includes("|") && !line.includes("---")) {
      const cells = line
        .split("|")
        .map((cell) => cell.trim())
        .filter((cell) => cell);
      if (cells.length > 1) {
        const nextLine = lines[i + 1];
        const isHeader = nextLine?.includes("---");

        if (isHeader) {
          tableHeaders = cells;
          isInTable = true;
        } else if (isInTable || tableRows.length > 0) {
          tableRows.push(cells);
        }

        // Check if table ended
        const nextNonTableLine = lines[i + 1];
        if (!nextNonTableLine?.includes("|") && tableRows.length > 0) {
          processedContent.push({
            type: "table",
            content: { headers: tableHeaders, rows: [...tableRows] },
            index: i,
          });
          tableRows.length = 0;
          tableHeaders = [];
          isInTable = false;
        }
      }
    }
    // Skip table separator lines
    else if (line.includes("---") && line.includes("|")) {
      continue;
    }
    // Bullet points
    else if (line.startsWith("- ")) {
      processedContent.push({
        type: "bullet",
        content: line.replace("- ", ""),
        index: i,
      });
    }
    // Regular text
    else if (line.trim()) {
      processedContent.push({
        type: "text",
        content: line,
        index: i,
      });
    }
  }

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-6 mt-2 space-y-4">
      {processedContent.map((item, index) => {
        switch (item.type) {
          case "header":
            return (
              <h3
                key={index}
                className="text-xl font-bold text-slate-900 border-b border-slate-200 pb-2"
              >
                {item.content}
              </h3>
            );

          case "table":
            return (
              <div
                key={index}
                className="overflow-hidden border border-slate-200 rounded-lg"
              >
                <table className="w-full">
                  <thead className="bg-slate-50">
                    <tr>
                      {item.content.headers.map(
                        (header: string, headerIndex: number) => (
                          <th
                            key={headerIndex}
                            className="px-4 py-3 text-left text-sm font-semibold text-slate-900 border-b border-slate-200"
                          >
                            {header}
                          </th>
                        )
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {item.content.rows.map(
                      (row: string[], rowIndex: number) => (
                        <tr key={rowIndex} className="hover:bg-slate-50">
                          {row.map((cell: string, cellIndex: number) => (
                            <td
                              key={cellIndex}
                              className="px-4 py-3 text-sm text-slate-700"
                            >
                              {cell.startsWith("**") && cell.endsWith("**") ? (
                                <strong>{cell.replace(/\*\*/g, "")}</strong>
                              ) : (
                                cell
                              )}
                            </td>
                          ))}
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>
            );

          case "bullet":
            return (
              <div key={index} className="flex items-start gap-3 py-1">
                <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                <span className="text-sm text-slate-700 leading-relaxed">
                  {item.content}
                </span>
              </div>
            );

          case "text":
            return (
              <p key={index} className="text-sm text-slate-700 leading-relaxed">
                {item.content}
              </p>
            );

          default:
            return null;
        }
      })}
    </div>
  );
};

const hasArtifactContent = (content: string): boolean => {
  return (
    content.includes("##") || content.includes("|") || content.includes("- ")
  );
};

export function Dashboard() {
  const { canCreateTrials, canInviteMembers, canViewStats } = usePermissions();
  const {
    stats,
    organizationId,
    memberId,
    metrics,
    refreshData,
    inviteMember,
  } = useAppData();
  const [showTrialDialog, setShowTrialDialog] = useState(false);
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [chatMessage, setChatMessage] = useState("");

  const [messages, setMessages] = useState<
    {
      role: "user" | "assistant";
      content: string;
      hasArtifact?: boolean;
      artifactData?: any;
    }[]
  >([]);
  const [isLoading, setIsLoading] = useState(false);

  const groq = new Groq({
    apiKey: import.meta.env.VITE_GROQ_API_KEY,
    dangerouslyAllowBrowser: true,
  });
  const { createTrialMutation } = useOnboardingMutations({
    organizationId,
    memberId,
  });

  // Split stats into two rows for the left panel
  const dashboardStatsRows = [
    [
      {
        name: "Active Trials",
        value: stats?.totalTrials?.toString() || "0",
        icon: FileText,
        color: "text-blue-600",
        href: "/trials",
      },
      {
        name: "Total Patients",
        value: "2",
        icon: Users,
        color: "text-blue-600",
        href: "/organization?tab=patients",
      },
    ],
    [
      {
        name: "Team Members",
        value: stats?.totalMembers?.toString() || "0",
        icon: Users,
        color: "text-blue-600",
        href: "/organization",
      },
      {
        name: "Pending Invitations",
        value: stats?.totalInvitations?.toString() || "0",
        icon: Clock,
        color: "text-blue-600",
        href: null,
      },
    ],
  ];

  // Determine if this is the first trial
  const isFirstTrial = (metrics?.trials?.length || 0) === 0;

  const handleCreateTrial = (trialData: any) => {
    createTrialMutation.mutate(trialData, {
      onSuccess: async () => {
        setShowTrialDialog(false);
        if (refreshData) await refreshData();
      },
    });
  };

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMessage.trim() || isLoading) return;

    const userMessage = chatMessage.trim();
    setChatMessage("");
    setIsLoading(true);

    // Add user message
    const newMessages = [
      ...messages,
      { role: "user" as const, content: userMessage },
    ];
    setMessages(newMessages);

    try {
      // Get real trial data and financial data
      const { data: trials, error: trialsError } = await supabase
        .from("trials")
        .select(
          `
          id,
          name,
          phase,
          status,
          budget_data
        `
        )
        .eq("organization_id", organizationId);

      let contextData = `Organization ID: ${organizationId}
- Total Trials: ${stats?.totalTrials || 0}
- Total Members: ${stats?.totalMembers || 0}
- Total Patients: 2
- Pending Invitations: ${stats?.totalInvitations || 0}`;

      if (trials && trials.length > 0) {
        contextData += `\n\nTrial Details:`;
        let totalBudget = 0;
        let totalSpent = 0;

        for (const trial of trials) {
          const { count } = await supabase
            .from("trial_patients")
            .select("*", { count: "exact", head: true })
            .eq("trial_id", trial.id);

          const budgetData = (trial.budget_data as Record<string, any>) || {};
          const budget = budgetData.total_budget || 0;
          const spent = budgetData.spent_to_date || 0;

          totalBudget += budget;
          totalSpent += spent;

          contextData += `\n- "${trial.name}" (Phase ${trial.phase}, Status: ${trial.status})`;
          contextData += `\n  * Patients: ${count || 0}`;
          contextData += `\n  * Budget: $${budget.toLocaleString()}`;
          contextData += `\n  * Spent: $${spent.toLocaleString()}`;
          contextData += `\n  * Remaining: $${(
            budget - spent
          ).toLocaleString()}`;
        }

        contextData += `\n\nOrganization Financial Summary:`;
        contextData += `\n- Total Budget: $${totalBudget.toLocaleString()}`;
        contextData += `\n- Total Spent: $${totalSpent.toLocaleString()}`;
        contextData += `\n- Total Remaining: $${(
          totalBudget - totalSpent
        ).toLocaleString()}`;
        contextData += `\n- Budget Utilization: ${
          totalBudget > 0 ? ((totalSpent / totalBudget) * 100).toFixed(1) : 0
        }%`;
      }

      const contextPrompt = `You are Assistant, an intelligent clinical trials assistant with access to real organization data:

${contextData}

You have complete freedom to decide how to respond to user queries. You can:
- Answer conversationally for simple questions
- Create structured data presentations using markdown formatting when you think it would be helpful
- Use tables (| separators), headers (## text), and bullet points (- text) when organizing complex information
- Be creative in how you present information - you decide what's most useful for the user

The system can render:
- ## Headers for sections
- | Table | Format | With | Columns |
- - Bullet points for lists
- Regular conversational text

Choose the best format based on what the user is asking and what would be most helpful to them. Trust your judgment on when to use structured vs conversational responses.`;

      const chatCompletion = await groq.chat.completions.create({
        messages: [
          { role: "system", content: contextPrompt },
          ...newMessages
            .slice(-5)
            .map((msg) => ({ role: msg.role, content: msg.content })), // Keep last 5 messages for context, strip extra properties
        ],
        model: "llama-3.3-70b-versatile",
        temperature: 0.7,
        max_completion_tokens: 512,
        top_p: 1,
        stream: true,
      });

      let assistantResponse = "";

      // Add placeholder for assistant message
      setMessages([...newMessages, { role: "assistant", content: "" }]);

      for await (const chunk of chatCompletion) {
        const content = chunk.choices[0]?.delta?.content || "";
        assistantResponse += content;

        // Update the last message (assistant's response) in real-time
        setMessages((prev) => [
          ...prev.slice(0, -1),
          {
            role: "assistant",
            content: assistantResponse,
            hasArtifact: hasArtifactContent(assistantResponse),
          },
        ]);
      }
    } catch (error) {
      console.error("Error with Groq chat:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "Sorry, I'm having trouble connecting right now. Please try again.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-8">
      {/* Stats Grid - Only visible to admin */}
      {canViewStats && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
          {/* Quick Actions arriba a la derecha, ocupa todo el alto */}
          <div className="flex flex-col justify-start h-full">
            <Card className="p-6 h-full flex flex-col">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Quick Actions
              </h3>
              <div className="space-y-3">
                {canCreateTrials && (
                  <Dialog
                    open={showTrialDialog}
                    onOpenChange={setShowTrialDialog}
                  >
                    <DialogTrigger asChild>
                      <Button
                        className="w-full justify-start bg-blue-600 hover:bg-blue-700"
                        onClick={() => setShowTrialDialog(true)}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Create New Trial
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Create New Trial</DialogTitle>
                      </DialogHeader>
                      <CreateTrial
                        onComplete={handleCreateTrial}
                        isFirstTrial={isFirstTrial}
                        organizationId={organizationId || ""}
                      />
                    </DialogContent>
                  </Dialog>
                )}
                {canInviteMembers && (
                  <>
                    <Button
                      variant="outline"
                      className="w-full justify-start "
                      onClick={() => setShowInviteDialog(true)}
                    >
                      <Users className="h-4 w-4 mr-2" />
                      Assign a new Patient
                    </Button>
                    <InviteMemberDialog
                      open={showInviteDialog}
                      onOpenChange={setShowInviteDialog}
                      onInvite={async (members) => {
                        for (const member of members) {
                          await inviteMember(
                            member.email,
                            member.name,
                            member.role
                          );
                        }
                        setShowInviteDialog(false);
                      }}
                    />
                  </>
                )}
                {canInviteMembers && (
                  <>
                    <Button
                      variant="outline"
                      className="w-full justify-start "
                      onClick={() => setShowInviteDialog(true)}
                    >
                      <Users className="h-4 w-4 mr-2" />
                      Invite a Member to the Organization
                    </Button>
                    <InviteMemberDialog
                      open={showInviteDialog}
                      onOpenChange={setShowInviteDialog}
                      onInvite={async (members) => {
                        for (const member of members) {
                          await inviteMember(
                            member.email,
                            member.name,
                            member.role
                          );
                        }
                        setShowInviteDialog(false);
                      }}
                    />
                  </>
                )}

                {!canCreateTrials && !canInviteMembers && (
                  <div className="text-sm text-gray-500">
                    <p>Welcome to your dashboard!</p>
                    <p className="mt-2">
                      Access your assigned trials from the Trials section.
                    </p>
                  </div>
                )}
              </div>
            </Card>
          </div>
          <div className="space-y-4">
            {dashboardStatsRows.map((row, rowIdx) => (
              <div
                key={rowIdx}
                className="grid grid-cols-1 sm:grid-cols-2 gap-6"
              >
                {row.map((stat) => (
                  <Link
                    to={stat.href}
                    key={stat.name}
                    className={`${stat.href ? "" : "cursor-not-allowed"}`}
                  >
                    <Card className="p-6">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <stat.icon className={`h-8 w-8 ${stat.color}`} />
                        </div>
                        <div className="ml-5 w-0 flex-1">
                          <dl>
                            <dt className="text-sm font-medium text-gray-500 truncate">
                              {stat.name}
                            </dt>
                            <dd className="text-lg font-medium text-gray-900">
                              {stat.value}
                            </dd>
                          </dl>
                        </div>
                      </div>
                    </Card>
                  </Link>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Chat de Assistant AI abajo, ancho completo */}
      <div className="flex flex-col w-full mt-8">
        <Card className="flex flex-col h-full min-h-[400px] max-h-[600px]">
          {/* Header */}
          <div className="p-4 border-b border-gray-200 bg-gray-50 rounded-t-md">
            <h3 className="text-lg font-semibold text-gray-900">
              AI Assistant
            </h3>
          </div>
          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-white">
            {messages.length === 0 ? (
              <div className="text-sm text-gray-500 text-center mt-8">
                No messages yet. Say hello to Assistant!
              </div>
            ) : (
              messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${
                    message.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[80%] ${
                      message.role === "user"
                        ? "bg-blue-600 text-white p-3 rounded-lg text-sm"
                        : message.hasArtifact
                        ? "bg-white border border-slate-200 rounded-lg p-3 text-sm"
                        : "bg-gray-100 text-gray-900 p-3 rounded-lg text-sm"
                    }`}
                  >
                    {message.role === "assistant" && message.hasArtifact ? (
                      <div>
                        <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-200">
                          <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                          <span className="text-xs font-medium text-slate-600 uppercase tracking-wide">
                            Data Analysis
                          </span>
                        </div>
                        <ArtifactRenderer content={message.content} />
                      </div>
                    ) : (
                      message.content
                    )}
                  </div>
                </div>
              ))
            )}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 text-gray-900 p-3 rounded-lg text-sm">
                  <div className="flex items-center gap-2">
                    <div className="animate-pulse">●</div>
                    <div
                      className="animate-pulse"
                      style={{ animationDelay: "0.2s" }}
                    >
                      ●
                    </div>
                    <div
                      className="animate-pulse"
                      style={{ animationDelay: "0.4s" }}
                    >
                      ●
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
          {/* Input Box */}
          <form
            onSubmit={handleChatSubmit}
            className="p-4 border-t border-gray-200 bg-gray-50 rounded-b-md"
          >
            <div className="flex gap-2">
              <input
                type="text"
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ask Assistant about your trials..."
                disabled={isLoading}
              />
              <Button
                type="submit"
                disabled={isLoading || !chatMessage.trim()}
                className="bg-blue-600 hover:bg-blue-700 text-sm"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
