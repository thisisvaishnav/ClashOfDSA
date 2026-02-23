"use client";

import { useState } from "react";
import {
  Settings,
  User,
  Mail,
  Trophy,
  Shield,
  Save,
  Loader2,
  Bell,
  Monitor,
  Volume2,
  Eye,
  Swords,
} from "lucide-react";
import { useSession } from "../../../lib/auth-client";
import {
  GamePanel,
  GameButton,
  GameBadge,
  GameInput,
  HazardStripe,
} from "../../../components/game-ui";

/* ────────────────────────────────────────────────────────────
   Types
   ──────────────────────────────────────────────────────────── */

type SettingsSection = "profile" | "preferences" | "notifications";

/* ────────────────────────────────────────────────────────────
   Toggle Switch
   ──────────────────────────────────────────────────────────── */

type ToggleSwitchProps = {
  checked: boolean;
  onChange: (val: boolean) => void;
  label: string;
  description?: string;
  icon?: React.ReactNode;
};

const ToggleSwitch = ({
  checked,
  onChange,
  label,
  description,
  icon,
}: ToggleSwitchProps) => {
  const handleToggle = () => onChange(!checked);
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleToggle();
    }
  };

  return (
    <div className="flex items-center justify-between py-3">
      <div className="flex items-center gap-3">
        {icon && (
          <span className="text-game-navy/40">{icon}</span>
        )}
        <div>
          <p className="text-sm font-bold text-game-navy uppercase">
            {label}
          </p>
          {description && (
            <p className="text-[10px] text-game-navy/50 font-medium">
              {description}
            </p>
          )}
        </div>
      </div>
      <button
        role="switch"
        aria-checked={checked}
        aria-label={label}
        tabIndex={0}
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
        className={`relative inline-flex h-7 w-12 items-center border-[2px] border-game-navy rounded-sm transition-colors cursor-pointer ${
          checked ? "bg-game-green" : "bg-game-cream-dark"
        }`}
      >
        <span
          className={`inline-block h-4 w-4 border-[2px] border-game-navy rounded-sm bg-game-cream transition-transform ${
            checked ? "translate-x-5" : "translate-x-1"
          }`}
        />
      </button>
    </div>
  );
};

/* ────────────────────────────────────────────────────────────
   Settings Page
   ──────────────────────────────────────────────────────────── */

const SettingsPage = () => {
  const { data: session } = useSession();
  const [activeSection, setActiveSection] =
    useState<SettingsSection>("profile");
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const [displayName, setDisplayName] = useState(
    session?.user?.name ?? "",
  );

  const [prefs, setPrefs] = useState({
    soundEffects: true,
    matchNotifications: true,
    friendRequestNotifications: true,
    showOnlineStatus: true,
    showRatingPublicly: true,
    compactMode: false,
  });

  const handleSaveProfile = async () => {
    setSaving(true);
    setSaveSuccess(false);
    await new Promise((r) => setTimeout(r, 800));
    setSaving(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  const handleTogglePref = (key: keyof typeof prefs) => (val: boolean) => {
    setPrefs((prev) => ({ ...prev, [key]: val }));
  };

  const userRating =
    (session?.user as Record<string, unknown> | undefined)?.rating as
      | number
      | undefined;

  const sections: { id: SettingsSection; label: string; icon: React.ReactNode }[] = [
    { id: "profile", label: "Profile", icon: <User size={14} /> },
    { id: "preferences", label: "Preferences", icon: <Monitor size={14} /> },
    { id: "notifications", label: "Notifications", icon: <Bell size={14} /> },
  ];

  return (
    <div className="mx-auto max-w-4xl px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <GameBadge variant="amber">
            <Settings size={10} />
            Settings
          </GameBadge>
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-game-navy md:text-4xl uppercase">
          Settings
        </h1>
        <p className="mt-2 text-sm text-game-navy/50 font-bold">
          Manage your profile and preferences
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-6">
        {/* Sidebar Tabs */}
        <div className="flex md:flex-col gap-2">
          {sections.map((sec) => (
            <button
              key={sec.id}
              onClick={() => setActiveSection(sec.id)}
              tabIndex={0}
              aria-label={sec.label}
              className={`flex items-center gap-2 px-4 py-2.5 border-[2px] rounded-sm text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                activeSection === sec.id
                  ? "bg-game-amber text-game-navy border-game-amber game-shadow-sm"
                  : "bg-game-cream text-game-navy/60 border-game-navy/20 hover:bg-game-cream-dark hover:border-game-navy/30"
              }`}
            >
              {sec.icon}
              {sec.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div>
          {/* ── Profile Section ── */}
          {activeSection === "profile" && (
            <GamePanel
              variant="default"
              hasShadow
              shadowSize="sm"
              className="!p-0 overflow-hidden"
            >
              <HazardStripe variant="warning" height="sm" />
              <div className="p-6">
                <div className="flex items-center gap-2 mb-6">
                  <GameBadge variant="info">
                    <User size={10} />
                    Profile Info
                  </GameBadge>
                </div>

                {/* Avatar + Name */}
                <div className="flex items-center gap-4 mb-6">
                  <div className="flex h-16 w-16 items-center justify-center border-[3px] border-game-navy rounded-sm bg-game-amber/20 text-2xl font-bold text-game-amber-dark game-shadow-sm">
                    {(session?.user?.name ?? "?").charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-lg font-bold text-game-navy uppercase">
                      {session?.user?.name ?? "Player"}
                    </p>
                    <div className="flex items-center gap-3 mt-1">
                      <div className="flex items-center gap-1">
                        <Trophy size={12} className="text-game-amber" />
                        <span className="text-xs font-bold text-game-navy/60">
                          {userRating ?? 1200}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Shield size={12} className="text-game-blue" />
                        <span className="text-xs font-bold text-game-navy/60">
                          Member
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Form Fields */}
                <div className="space-y-4">
                  <GameInput
                    label="Display Name"
                    icon={<User size={16} />}
                    placeholder="Your display name"
                    value={displayName}
                    onChange={setDisplayName}
                    autoComplete="name"
                  />

                  <div>
                    <label className="block text-[10px] font-bold text-game-navy/60 uppercase tracking-wider mb-1.5">
                      Email
                    </label>
                    <div className="flex items-center gap-2 px-3 py-2.5 border-[2px] border-game-navy/20 rounded-sm bg-game-cream-dark">
                      <Mail size={16} className="text-game-navy/30" />
                      <span className="text-sm text-game-navy/50 font-medium">
                        {session?.user?.email ?? "—"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Save */}
                <div className="mt-6 flex items-center gap-3">
                  <GameButton
                    variant="primary"
                    size="md"
                    onClick={handleSaveProfile}
                    disabled={saving}
                  >
                    {saving ? (
                      <>
                        <Loader2 size={14} className="animate-spin" />
                        Saving…
                      </>
                    ) : (
                      <>
                        <Save size={14} />
                        Save Changes
                      </>
                    )}
                  </GameButton>
                  {saveSuccess && (
                    <GameBadge variant="success">Saved!</GameBadge>
                  )}
                </div>
              </div>
            </GamePanel>
          )}

          {/* ── Preferences Section ── */}
          {activeSection === "preferences" && (
            <GamePanel
              variant="default"
              hasShadow
              shadowSize="sm"
              className="!p-0 overflow-hidden"
            >
              <HazardStripe variant="info" height="sm" />
              <div className="p-6">
                <div className="flex items-center gap-2 mb-6">
                  <GameBadge variant="info">
                    <Monitor size={10} />
                    Preferences
                  </GameBadge>
                </div>

                <div className="divide-y-[2px] divide-game-navy/10">
                  <ToggleSwitch
                    checked={prefs.soundEffects}
                    onChange={handleTogglePref("soundEffects")}
                    label="Sound Effects"
                    description="Play sound effects during matches and navigation"
                    icon={<Volume2 size={16} />}
                  />
                  <ToggleSwitch
                    checked={prefs.showOnlineStatus}
                    onChange={handleTogglePref("showOnlineStatus")}
                    label="Online Status"
                    description="Let friends see when you're online"
                    icon={<Eye size={16} />}
                  />
                  <ToggleSwitch
                    checked={prefs.showRatingPublicly}
                    onChange={handleTogglePref("showRatingPublicly")}
                    label="Public Rating"
                    description="Show your rating on the leaderboard"
                    icon={<Trophy size={16} />}
                  />
                  <ToggleSwitch
                    checked={prefs.compactMode}
                    onChange={handleTogglePref("compactMode")}
                    label="Compact Mode"
                    description="Use a more compact layout for the dashboard"
                    icon={<Swords size={16} />}
                  />
                </div>
              </div>
            </GamePanel>
          )}

          {/* ── Notifications Section ── */}
          {activeSection === "notifications" && (
            <GamePanel
              variant="default"
              hasShadow
              shadowSize="sm"
              className="!p-0 overflow-hidden"
            >
              <HazardStripe variant="warning" height="sm" />
              <div className="p-6">
                <div className="flex items-center gap-2 mb-6">
                  <GameBadge variant="warning">
                    <Bell size={10} />
                    Notification Settings
                  </GameBadge>
                </div>

                <div className="divide-y-[2px] divide-game-navy/10">
                  <ToggleSwitch
                    checked={prefs.matchNotifications}
                    onChange={handleTogglePref("matchNotifications")}
                    label="Match Notifications"
                    description="Get notified when a match is found"
                    icon={<Swords size={16} />}
                  />
                  <ToggleSwitch
                    checked={prefs.friendRequestNotifications}
                    onChange={handleTogglePref("friendRequestNotifications")}
                    label="Friend Requests"
                    description="Get notified about new friend requests"
                    icon={<User size={16} />}
                  />
                </div>
              </div>
            </GamePanel>
          )}
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
