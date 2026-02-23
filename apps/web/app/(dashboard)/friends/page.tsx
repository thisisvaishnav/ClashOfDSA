"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Users,
  UserPlus,
  MessageSquare,
  Send,
  Loader2,
  Trophy,
  Check,
  X,
  Search,
  ArrowLeft,
  Clock,
  Shield,
} from "lucide-react";
import { useSession } from "../../../lib/auth-client";
import { connectSocket, getSocket, disconnectSocket } from "../../../lib/socket";
import {
  GamePanel,
  GameButton,
  GameBadge,
  GameInput,
  GameIconButton,
  HazardStripe,
  GameAlert,
} from "../../../components/game-ui";

/* ────────────────────────────────────────────────────────────
   Types
   ──────────────────────────────────────────────────────────── */

type FriendItem = {
  userId: string;
  name: string;
  image: string | null;
  rating: number;
  since: string;
};

type FriendRequestItem = {
  id: string;
  requesterId: string;
  requesterName: string;
  addresseeId: string;
  addresseeName: string;
  status: "PENDING" | "ACCEPTED" | "REJECTED";
  createdAt: string;
};

type ChatMessage = {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  createdAt: string;
};

type FriendsTab = "friends" | "requests";

/* ────────────────────────────────────────────────────────────
   API helpers
   ──────────────────────────────────────────────────────────── */

const getApiBase = (): string =>
  typeof window !== "undefined"
    ? (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000")
    : "";

const apiFetch = async <T,>(
  path: string,
  options?: RequestInit,
): Promise<{ success: boolean; data?: T; error?: string }> => {
  const base = getApiBase();
  try {
    const res = await fetch(`${base}${path}`, {
      credentials: "include",
      ...options,
    });
    const json = await res.json();
    return json;
  } catch {
    return { success: false, error: "Network error" };
  }
};

/* ────────────────────────────────────────────────────────────
   Rating Tier Helper
   ──────────────────────────────────────────────────────────── */

const getRatingTier = (
  rating: number,
): { label: string; color: string } => {
  if (rating >= 2000) return { label: "Grandmaster", color: "text-red-500" };
  if (rating >= 1800) return { label: "Master", color: "text-purple-500" };
  if (rating >= 1600) return { label: "Diamond", color: "text-blue-400" };
  if (rating >= 1400) return { label: "Platinum", color: "text-teal-400" };
  if (rating >= 1200) return { label: "Gold", color: "text-game-amber" };
  return { label: "Silver", color: "text-gray-400" };
};

/* ────────────────────────────────────────────────────────────
   Chat Panel
   ──────────────────────────────────────────────────────────── */

type ChatPanelProps = {
  friend: FriendItem;
  currentUserId: string;
  onBack: () => void;
};

const ChatPanel = ({ friend, currentUserId, onBack }: ChatPanelProps) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  const loadMessages = useCallback(async () => {
    setLoading(true);
    const result = await apiFetch<ChatMessage[]>(
      `/api/chat/${friend.userId}?page=1&limit=50`,
    );
    if (result.success && result.data) {
      setMessages(result.data.reverse());
    }
    setLoading(false);
  }, [friend.userId]);

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    const socket = connectSocket();

    const handleNewMessage = (data: {
      id: string;
      senderId: string;
      content: string;
      createdAt: string;
    }) => {
      if (
        data.senderId === friend.userId ||
        data.senderId === currentUserId
      ) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === data.id)) return prev;
          return [
            ...prev,
            {
              id: data.id,
              senderId: data.senderId,
              receiverId:
                data.senderId === currentUserId
                  ? friend.userId
                  : currentUserId,
              content: data.content,
              createdAt: data.createdAt,
            },
          ];
        });
      }
    };

    const handleUserTyping = (data: { userId: string }) => {
      if (data.userId === friend.userId) {
        setIsTyping(true);
      }
    };

    const handleUserStopTyping = (data: { userId: string }) => {
      if (data.userId === friend.userId) {
        setIsTyping(false);
      }
    };

    socket.on("chat:new-message", handleNewMessage);
    socket.on("chat:user-typing", handleUserTyping);
    socket.on("chat:user-stop-typing", handleUserStopTyping);

    return () => {
      socket.off("chat:new-message", handleNewMessage);
      socket.off("chat:user-typing", handleUserTyping);
      socket.off("chat:user-stop-typing", handleUserStopTyping);
    };
  }, [friend.userId, currentUserId]);

  const handleSendMessage = async () => {
    const content = newMessage.trim();
    if (!content || sending) return;

    setSending(true);
    setNewMessage("");

    const socket = getSocket();
    if (socket?.connected) {
      socket.emit("chat:send-message", {
        receiverId: friend.userId,
        content,
      });
      socket.emit("chat:stop-typing", { receiverId: friend.userId });
    } else {
      await apiFetch<ChatMessage>(`/api/chat/${friend.userId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
    }

    setSending(false);
  };

  const handleInputChange = (value: string) => {
    setNewMessage(value);
    const socket = getSocket();
    if (!socket?.connected) return;

    socket.emit("chat:typing", { receiverId: friend.userId });
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit("chat:stop-typing", { receiverId: friend.userId });
    }, 2000);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const tier = getRatingTier(friend.rating);

  const formatTime = (isoString: string): string => {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60_000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;

    return date.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="flex flex-col h-full">
      {/* Chat Header */}
      <div className="flex items-center gap-3 px-4 py-3 bg-game-navy">
        <button
          onClick={onBack}
          className="flex h-7 w-7 items-center justify-center border-[2px] border-game-navy-light rounded-sm bg-game-navy-light text-game-cream hover:bg-game-cream/10 transition-colors cursor-pointer md:hidden"
          aria-label="Back to friend list"
          tabIndex={0}
        >
          <ArrowLeft size={14} />
        </button>
        <div className="flex h-9 w-9 items-center justify-center border-[2px] border-game-amber rounded-sm bg-game-amber/20 text-sm font-bold text-game-amber">
          {friend.name.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-game-cream uppercase truncate">
            {friend.name}
          </p>
          <p className={`text-[10px] font-bold ${tier.color}`}>
            {tier.label} — {friend.rating}
          </p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-game-cream-dark/50">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-6 w-6 animate-spin text-game-navy/30" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-2">
            <MessageSquare className="h-10 w-10 text-game-navy/15" />
            <p className="text-xs font-bold text-game-navy/30 uppercase">
              No messages yet
            </p>
            <p className="text-[10px] text-game-navy/20 font-medium">
              Say hello to {friend.name}!
            </p>
          </div>
        ) : (
          <>
            {messages.map((msg) => {
              const isOwn = msg.senderId === currentUserId;
              return (
                <div
                  key={msg.id}
                  className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[75%] border-[2px] border-game-navy rounded-sm px-3 py-2 ${
                      isOwn
                        ? "bg-game-blue text-game-cream"
                        : "bg-game-cream text-game-navy"
                    }`}
                  >
                    <p className="text-sm font-medium break-words">
                      {msg.content}
                    </p>
                    <p
                      className={`text-[9px] font-bold mt-1 ${
                        isOwn ? "text-game-cream/50" : "text-game-navy/30"
                      }`}
                    >
                      {formatTime(msg.createdAt)}
                    </p>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </>
        )}

        {isTyping && (
          <div className="flex items-center gap-2">
            <div className="border-[2px] border-game-navy/20 rounded-sm px-3 py-2 bg-game-cream">
              <div className="flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-game-navy/40 animate-bounce" />
                <span className="h-1.5 w-1.5 rounded-full bg-game-navy/40 animate-bounce [animation-delay:0.15s]" />
                <span className="h-1.5 w-1.5 rounded-full bg-game-navy/40 animate-bounce [animation-delay:0.3s]" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Message Input */}
      <div className="flex items-center gap-2 px-4 py-3 border-t-[2px] border-game-navy/10 bg-game-cream">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => handleInputChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message…"
          className="flex-1 px-3 py-2 border-[2px] border-game-navy/20 rounded-sm bg-game-cream-dark text-sm text-game-navy font-medium placeholder:text-game-navy/30 focus:outline-none focus:border-game-navy/40 transition-colors"
          aria-label="Message input"
        />
        <GameIconButton
          variant="blue"
          size="md"
          aria-label="Send message"
          onClick={handleSendMessage}
          disabled={!newMessage.trim() || sending}
        >
          {sending ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Send size={16} />
          )}
        </GameIconButton>
      </div>
    </div>
  );
};

/* ────────────────────────────────────────────────────────────
   Friends Page
   ──────────────────────────────────────────────────────────── */

const FriendsPage = () => {
  const { data: session } = useSession();
  const currentUserId = session?.user?.id ?? "";

  const [friends, setFriends] = useState<FriendItem[]>([]);
  const [requests, setRequests] = useState<FriendRequestItem[]>([]);
  const [loadingFriends, setLoadingFriends] = useState(true);
  const [loadingRequests, setLoadingRequests] = useState(true);
  const [activeTab, setActiveTab] = useState<FriendsTab>("friends");
  const [selectedFriend, setSelectedFriend] = useState<FriendItem | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [addFriendId, setAddFriendId] = useState("");
  const [addFriendLoading, setAddFriendLoading] = useState(false);
  const [addFriendMsg, setAddFriendMsg] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const loadFriends = useCallback(async () => {
    setLoadingFriends(true);
    const result = await apiFetch<FriendItem[]>("/api/friends");
    if (result.success && result.data) {
      setFriends(result.data);
    }
    setLoadingFriends(false);
  }, []);

  const loadRequests = useCallback(async () => {
    setLoadingRequests(true);
    const result = await apiFetch<FriendRequestItem[]>(
      "/api/friends/requests",
    );
    if (result.success && result.data) {
      setRequests(result.data);
    }
    setLoadingRequests(false);
  }, []);

  useEffect(() => {
    if (!currentUserId) return;
    loadFriends();
    loadRequests();
  }, [currentUserId, loadFriends, loadRequests]);

  useEffect(() => {
    if (!currentUserId) return;
    connectSocket();
    return () => {
      disconnectSocket();
    };
  }, [currentUserId]);

  const handleAddFriend = async () => {
    const id = addFriendId.trim();
    if (!id) return;

    setAddFriendLoading(true);
    setAddFriendMsg(null);

    const result = await apiFetch<FriendRequestItem>("/api/friends/request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ addresseeId: id }),
    });

    if (result.success) {
      setAddFriendMsg({ type: "success", text: "Friend request sent!" });
      setAddFriendId("");
      loadRequests();
    } else {
      setAddFriendMsg({
        type: "error",
        text: result.error ?? "Failed to send request",
      });
    }
    setAddFriendLoading(false);
  };

  const handleAcceptRequest = async (requestId: string) => {
    setActionLoading(requestId);
    const result = await apiFetch("/api/friends/accept", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ requestId }),
    });
    if (result.success) {
      loadFriends();
      loadRequests();
    }
    setActionLoading(null);
  };

  const handleRejectRequest = async (requestId: string) => {
    setActionLoading(requestId);
    await apiFetch("/api/friends/reject", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ requestId }),
    });
    loadRequests();
    setActionLoading(null);
  };

  const handleSelectFriend = (friend: FriendItem) => {
    setSelectedFriend(friend);
  };

  const handleBackToList = () => {
    setSelectedFriend(null);
  };

  const filteredFriends = friends.filter((f) =>
    f.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const pendingIncoming = requests.filter(
    (r) => r.status === "PENDING" && r.addresseeId === currentUserId,
  );
  const pendingOutgoing = requests.filter(
    (r) => r.status === "PENDING" && r.requesterId === currentUserId,
  );

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <GameBadge variant="amber">
            <Users size={10} />
            Social
          </GameBadge>
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-game-navy md:text-4xl uppercase">
          Friends
        </h1>
        <p className="mt-2 text-sm text-game-navy/50 font-bold">
          Manage your friends and chat in real-time
        </p>
      </div>

      {/* Main Layout */}
      <div className="grid grid-cols-1 md:grid-cols-[340px_1fr] gap-6 h-[calc(100vh-260px)] min-h-[500px]">
        {/* ── Left Panel: Friend List ── */}
        <div
          className={`flex flex-col ${
            selectedFriend ? "hidden md:flex" : "flex"
          }`}
        >
          <GamePanel
            variant="default"
            hasShadow
            shadowSize="sm"
            noPadding
            className="flex flex-col h-full overflow-hidden"
          >
            <HazardStripe variant="warning" height="sm" />

            {/* Tabs */}
            <div className="flex border-b-[2px] border-game-navy/10">
              <button
                onClick={() => setActiveTab("friends")}
                tabIndex={0}
                aria-label="Friends tab"
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                  activeTab === "friends"
                    ? "bg-game-amber/10 text-game-navy border-b-[2px] border-game-amber -mb-[2px]"
                    : "text-game-navy/40 hover:text-game-navy/60"
                }`}
              >
                <Users size={12} />
                Friends ({friends.length})
              </button>
              <button
                onClick={() => setActiveTab("requests")}
                tabIndex={0}
                aria-label="Requests tab"
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer relative ${
                  activeTab === "requests"
                    ? "bg-game-amber/10 text-game-navy border-b-[2px] border-game-amber -mb-[2px]"
                    : "text-game-navy/40 hover:text-game-navy/60"
                }`}
              >
                <UserPlus size={12} />
                Requests
                {pendingIncoming.length > 0 && (
                  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-game-red text-[8px] font-bold text-game-cream">
                    {pendingIncoming.length}
                  </span>
                )}
              </button>
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-y-auto">
              {activeTab === "friends" && (
                <>
                  {/* Search */}
                  <div className="p-3 border-b-[2px] border-game-navy/10">
                    <div className="flex items-center gap-2 px-3 py-2 border-[2px] border-game-navy/20 rounded-sm bg-game-cream-dark">
                      <Search size={14} className="text-game-navy/30" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search friends…"
                        className="flex-1 bg-transparent text-sm text-game-navy font-medium placeholder:text-game-navy/30 focus:outline-none"
                        aria-label="Search friends"
                      />
                    </div>
                  </div>

                  {loadingFriends ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="h-6 w-6 animate-spin text-game-navy/30" />
                    </div>
                  ) : filteredFriends.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 gap-2">
                      <Users className="h-10 w-10 text-game-navy/15" />
                      <p className="text-xs font-bold text-game-navy/30 uppercase">
                        {friends.length === 0
                          ? "No friends yet"
                          : "No matches found"}
                      </p>
                    </div>
                  ) : (
                    filteredFriends.map((friend) => {
                      const tier = getRatingTier(friend.rating);
                      const isSelected =
                        selectedFriend?.userId === friend.userId;
                      return (
                        <button
                          key={friend.userId}
                          onClick={() => handleSelectFriend(friend)}
                          tabIndex={0}
                          aria-label={`Chat with ${friend.name}`}
                          className={`w-full flex items-center gap-3 px-4 py-3 border-b-[2px] border-game-navy/10 transition-colors cursor-pointer text-left ${
                            isSelected
                              ? "bg-game-amber/10 border-l-[3px] border-l-game-amber"
                              : "hover:bg-game-amber/5"
                          }`}
                        >
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center border-[2px] border-game-navy/30 rounded-sm bg-game-cream-dark text-sm font-bold text-game-navy">
                            {friend.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-game-navy uppercase truncate">
                              {friend.name}
                            </p>
                            <div className="flex items-center gap-2">
                              <span
                                className={`text-[10px] font-bold ${tier.color}`}
                              >
                                {tier.label}
                              </span>
                              <span className="text-[10px] text-game-navy/30">
                                •
                              </span>
                              <span className="text-[10px] font-bold text-game-navy/40">
                                {friend.rating}
                              </span>
                            </div>
                          </div>
                          <MessageSquare
                            size={14}
                            className="text-game-navy/20"
                          />
                        </button>
                      );
                    })
                  )}
                </>
              )}

              {activeTab === "requests" && (
                <>
                  {/* Add Friend */}
                  <div className="p-4 border-b-[2px] border-game-navy/10">
                    <p className="text-[10px] font-bold text-game-navy/50 uppercase tracking-wider mb-2">
                      Add a Friend
                    </p>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={addFriendId}
                        onChange={(e) => setAddFriendId(e.target.value)}
                        placeholder="Enter user ID…"
                        className="flex-1 px-3 py-2 border-[2px] border-game-navy/20 rounded-sm bg-game-cream-dark text-sm text-game-navy font-medium placeholder:text-game-navy/30 focus:outline-none focus:border-game-navy/40 transition-colors"
                        aria-label="Friend user ID"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleAddFriend();
                        }}
                      />
                      <GameIconButton
                        variant="blue"
                        size="md"
                        aria-label="Send friend request"
                        onClick={handleAddFriend}
                        disabled={!addFriendId.trim() || addFriendLoading}
                      >
                        {addFriendLoading ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          <UserPlus size={14} />
                        )}
                      </GameIconButton>
                    </div>
                    {addFriendMsg && (
                      <div className="mt-2">
                        <GameAlert
                          variant={
                            addFriendMsg.type === "success" ? "success" : "error"
                          }
                          message={addFriendMsg.text}
                          onClose={() => setAddFriendMsg(null)}
                        />
                      </div>
                    )}
                  </div>

                  {/* Incoming */}
                  {pendingIncoming.length > 0 && (
                    <div className="p-4 border-b-[2px] border-game-navy/10">
                      <p className="text-[10px] font-bold text-game-navy/50 uppercase tracking-wider mb-3">
                        Incoming Requests ({pendingIncoming.length})
                      </p>
                      <div className="space-y-2">
                        {pendingIncoming.map((req) => (
                          <div
                            key={req.id}
                            className="flex items-center gap-3 px-3 py-2.5 border-[2px] border-game-navy/10 rounded-sm bg-game-cream-dark"
                          >
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center border-[2px] border-game-blue/40 rounded-sm bg-game-blue/10">
                              <UserPlus
                                size={14}
                                className="text-game-blue"
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-bold text-game-navy uppercase truncate">
                                {req.requesterName}
                              </p>
                              <p className="text-[9px] text-game-navy/40 font-medium">
                                Wants to be friends
                              </p>
                            </div>
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleAcceptRequest(req.id)}
                                disabled={actionLoading === req.id}
                                className="flex h-7 w-7 items-center justify-center border-[2px] border-game-navy rounded-sm bg-game-green text-game-cream hover:bg-game-green/80 transition-colors cursor-pointer disabled:opacity-50"
                                aria-label={`Accept ${req.requesterName}`}
                                tabIndex={0}
                              >
                                {actionLoading === req.id ? (
                                  <Loader2
                                    size={12}
                                    className="animate-spin"
                                  />
                                ) : (
                                  <Check size={12} />
                                )}
                              </button>
                              <button
                                onClick={() => handleRejectRequest(req.id)}
                                disabled={actionLoading === req.id}
                                className="flex h-7 w-7 items-center justify-center border-[2px] border-game-navy rounded-sm bg-game-red text-game-cream hover:bg-game-red/80 transition-colors cursor-pointer disabled:opacity-50"
                                aria-label={`Reject ${req.requesterName}`}
                                tabIndex={0}
                              >
                                <X size={12} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Outgoing */}
                  {pendingOutgoing.length > 0 && (
                    <div className="p-4 border-b-[2px] border-game-navy/10">
                      <p className="text-[10px] font-bold text-game-navy/50 uppercase tracking-wider mb-3">
                        Sent Requests ({pendingOutgoing.length})
                      </p>
                      <div className="space-y-2">
                        {pendingOutgoing.map((req) => (
                          <div
                            key={req.id}
                            className="flex items-center gap-3 px-3 py-2.5 border-[2px] border-game-navy/10 rounded-sm bg-game-cream-dark"
                          >
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center border-[2px] border-game-amber/40 rounded-sm bg-game-amber/10">
                              <Clock
                                size={14}
                                className="text-game-amber"
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-bold text-game-navy uppercase truncate">
                                {req.addresseeName}
                              </p>
                              <p className="text-[9px] text-game-navy/40 font-medium">
                                Pending…
                              </p>
                            </div>
                            <GameBadge variant="default">Pending</GameBadge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {loadingRequests ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="h-6 w-6 animate-spin text-game-navy/30" />
                    </div>
                  ) : (
                    pendingIncoming.length === 0 &&
                    pendingOutgoing.length === 0 && (
                      <div className="flex flex-col items-center justify-center py-12 gap-2">
                        <Shield className="h-10 w-10 text-game-navy/15" />
                        <p className="text-xs font-bold text-game-navy/30 uppercase">
                          No pending requests
                        </p>
                        <p className="text-[10px] text-game-navy/20 font-medium">
                          Add a friend by their user ID above
                        </p>
                      </div>
                    )
                  )}
                </>
              )}
            </div>
          </GamePanel>
        </div>

        {/* ── Right Panel: Chat ── */}
        <div
          className={`${
            selectedFriend ? "flex" : "hidden md:flex"
          } flex-col`}
        >
          <GamePanel
            variant="default"
            hasShadow
            shadowSize="sm"
            noPadding
            className="flex flex-col h-full overflow-hidden"
          >
            {selectedFriend && currentUserId ? (
              <ChatPanel
                key={selectedFriend.userId}
                friend={selectedFriend}
                currentUserId={currentUserId}
                onBack={handleBackToList}
              />
            ) : (
              <>
                <HazardStripe variant="info" height="sm" />
                <div className="flex flex-col items-center justify-center h-full gap-3 p-8">
                  <div className="flex h-16 w-16 items-center justify-center border-[3px] border-game-navy/10 rounded-sm bg-game-cream-dark">
                    <MessageSquare className="h-8 w-8 text-game-navy/15" />
                  </div>
                  <p className="text-sm font-bold text-game-navy/30 uppercase">
                    Select a friend to chat
                  </p>
                  <p className="text-xs text-game-navy/20 font-medium text-center max-w-[220px]">
                    Pick someone from your friend list to start a conversation
                  </p>
                </div>
              </>
            )}
          </GamePanel>
        </div>
      </div>
    </div>
  );
};

export default FriendsPage;
