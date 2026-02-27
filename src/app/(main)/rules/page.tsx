const SECTIONS = [
    {
        id: "general",
        title: "General Rules",
        icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
        ),
        rules: [
            {
                title: "Respect all users",
                description: "Treat other users with respect. Harassment, hate speech, doxxing, threats, racial slurs, and personal attacks will result in an immediate permanent ban with no appeal.",
                severity: "critical",
            },
            {
                title: "One account per user",
                description: "Creating multiple accounts (alts) to bypass bans, boost scripts, manipulate votes, or evade restrictions is prohibited. All linked accounts will be terminated.",
                severity: "high",
            },
            {
                title: "No impersonation",
                description: "Do not impersonate other users, developers, staff members, or any real person. This includes using similar usernames, avatars, or claiming to be someone you are not.",
                severity: "high",
            },
            {
                title: "English language required",
                description: "All script titles, descriptions, and public communications must be in English or Indonesian. Scripts in other languages may be removed unless accompanied by a translation.",
                severity: "medium",
            },
            {
                title: "Follow staff instructions",
                description: "Moderator and admin decisions are final. Arguing publicly with staff, attempting to circumvent moderation actions, or inciting others to do so is not tolerated.",
                severity: "high",
            },
            {
                title: "No self-promotion or spam",
                description: "Do not spam comments, reviews, or DMs with promotional content for Discord servers, YouTube channels, other platforms, or paid services unless explicitly allowed.",
                severity: "medium",
            },
        ],
    },
    {
        id: "scripts",
        title: "Script Upload Guidelines",
        icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="16 18 22 12 16 6" />
                <polyline points="8 6 2 12 8 18" />
            </svg>
        ),
        rules: [
            {
                title: "No malicious code",
                description: "Scripts containing backdoors, keyloggers, token grabbers, remote access tools (RATs), crypto miners, IP loggers, webhook stealers, or any form of malware are strictly prohibited. Uploaders will be permanently banned and reported.",
                severity: "critical",
            },
            {
                title: "No obfuscated malware",
                description: "Using obfuscation tools (IronBrew2, LuaSeel, Moonsec, etc.) to hide malicious code is a bannable offense. Legitimate obfuscation to protect source code is allowed, but staff reserve the right to request deobfuscated versions for review.",
                severity: "critical",
            },
            {
                title: "Accurate metadata",
                description: "Script titles, descriptions, tags, game associations, and executor compatibility must be accurate. Clickbait, misleading feature claims, or fake download counts are not allowed.",
                severity: "high",
            },
            {
                title: "Test before publishing",
                description: "Scripts must be functional at time of upload. Broken, patched, or non-working scripts should be updated or removed. Repeated uploads of broken scripts will result in upload restrictions.",
                severity: "medium",
            },
            {
                title: "One script per listing",
                description: "Each upload should contain a single, focused script. Script packs or bundles are only allowed if clearly labeled and contain related functionality (e.g., a suite of tools for one game).",
                severity: "medium",
            },
            {
                title: "No low-effort scripts",
                description: "Scripts that only print text, display a single message, or have no meaningful functionality will be removed. Uploads must provide real value to users.",
                severity: "medium",
            },
            {
                title: "Update or deprecate",
                description: "If a game update breaks your script, either update it within a reasonable time or mark it as deprecated. Scripts reported as non-functional for 30+ days may be automatically archived.",
                severity: "medium",
            },
            {
                title: "No paywalled core features",
                description: "Free scripts must not require payment to access core functionality advertised in the listing. Key systems are allowed but must not be excessive (e.g., max 1 key, under 3 steps, no forced notifications).",
                severity: "high",
            },
        ],
    },
    {
        id: "plagiarism",
        title: "Credit & Intellectual Property",
        icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <path d="M15 9.354a4 4 0 1 0 0 5.292" />
            </svg>
        ),
        rules: [
            {
                title: "Credit original authors",
                description: "If your script uses, modifies, or is based on another creator's work, you must provide clear credit in the description with a link to the original source. Failure to credit is treated as plagiarism.",
                severity: "critical",
            },
            {
                title: "No re-uploads",
                description: "Re-uploading someone else's script as your own — modified or not — without explicit permission from the original author is prohibited. This includes renamed copies, \"updated\" versions without permission, and fork spam.",
                severity: "critical",
            },
            {
                title: "Open source respect",
                description: "If you use open-source libraries or frameworks, comply with their license terms. MIT, GPL, Apache, and other licenses have specific attribution and distribution requirements.",
                severity: "high",
            },
            {
                title: "DMCA and takedown requests",
                description: "We comply with valid DMCA and intellectual property takedown requests. If your script is removed due to a claim, you may file a counter-notice through our support channel.",
                severity: "medium",
            },
        ],
    },
    {
        id: "content",
        title: "Content Policy",
        icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                <circle cx="12" cy="12" r="3" />
            </svg>
        ),
        rules: [
            {
                title: "No NSFW content",
                description: "Scripts, thumbnails, descriptions, comments, or profile content containing pornographic, sexually explicit, or excessively graphic violent material are strictly prohibited.",
                severity: "critical",
            },
            {
                title: "No hateful content",
                description: "Content promoting discrimination based on race, ethnicity, religion, gender, sexual orientation, disability, or nationality is prohibited. This includes \"joke\" scripts targeting specific groups.",
                severity: "critical",
            },
            {
                title: "No real-world harm",
                description: "Scripts that facilitate real-world harm — including swatting tools, location tracking, personal info exposure, or coordination of real-world attacks — are prohibited and will be reported to authorities.",
                severity: "critical",
            },
            {
                title: "No phishing or social engineering",
                description: "Scripts designed to impersonate login pages, collect credentials through fake UIs, trick users into entering personal information, or redirect to phishing sites are banned.",
                severity: "critical",
            },
            {
                title: "No gambling mechanics",
                description: "Scripts that implement real-money gambling, loot boxes with real-money purchases, or any form of betting system are not allowed.",
                severity: "high",
            },
        ],
    },

    {
        id: "enforcement",
        title: "Enforcement & Penalties",
        icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 8v4" />
                <path d="M12 16h.01" />
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            </svg>
        ),
        rules: [
            {
                title: "Warning system",
                description: "Minor infractions (wrong tags, low-effort scripts) receive a warning. Three warnings within 30 days result in a 7-day upload restriction. Continued violations lead to escalating penalties.",
                severity: "medium",
            },
            {
                title: "Temporary bans",
                description: "Moderate infractions (plagiarism, misleading content, harassment) result in temporary bans ranging from 7 to 30 days depending on severity and history.",
                severity: "high",
            },
            {
                title: "Permanent bans",
                description: "Critical infractions (malware, NSFW, doxxing, real-world threats, repeated offenses) result in permanent bans with no appeal. All content from the banned account is removed.",
                severity: "critical",
            },
            {
                title: "Appeal process",
                description: "Non-permanent bans can be appealed through our support channel within 14 days of the ban. Appeals must include the ban reason, your account ID, and why the ban should be reconsidered. One appeal per ban.",
                severity: "medium",
            },
        ],
    },
];

const SEVERITY_CONFIG: Record<string, { dot: string; label: string; text: string }> = {
    critical: { dot: "bg-red-500", label: "Critical", text: "text-red-400" },
    high: { dot: "bg-amber-500", label: "High", text: "text-amber-400" },
    medium: { dot: "bg-offgray-500", label: "Standard", text: "text-offgray-400" },
};

export default function RulesPage() {
    let ruleCounter = 0;

    return (
        <div className="space-y-8">
            {/* Header */}
            <section className="space-y-1.5">
                <h1 className="heading-base text-2xl">Platform Rules</h1>
                <p className="text-sm text-offgray-500">
                    By using scripthub.id, you agree to follow these guidelines. We prioritize safety and quality to ensure the best experience for everyone.
                </p>
            </section>

            {/* Sections */}
            {SECTIONS.map((section) => (
                <section key={section.id} className="space-y-4" id={section.id}>
                    {/* Section header */}
                    <div className="flex items-center gap-3 pb-1">
                        <div className="w-8 h-8 rounded-md bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
                            {section.icon}
                        </div>
                        <h2 className="heading-base text-lg">{section.title}</h2>
                    </div>

                    {/* Rules */}
                    <div className="space-y-2">
                        {section.rules.map((rule) => {
                            ruleCounter++;
                            const style = SEVERITY_CONFIG[rule.severity];
                            const num = String(ruleCounter).padStart(2, "0");
                            return (
                                <div
                                    key={num}
                                    className="flex gap-4 p-4 bg-surface-panel border border-white/[0.06] rounded-lg hover:border-white/[0.1] transition-colors duration-100"
                                >
                                    <div className="shrink-0 w-7 h-7 rounded bg-white/[0.04] flex items-center justify-center">
                                        <span className="text-[11px] font-mono font-medium text-offgray-600">{num}</span>
                                    </div>
                                    <div className="flex-1 space-y-1.5 min-w-0">
                                        <div className="flex items-start sm:items-center gap-2 flex-wrap">
                                            <h3 className="text-sm font-medium text-offgray-50">{rule.title}</h3>
                                            <span className={["flex items-center gap-1 text-[10px] shrink-0", style.text].join(" ")}>
                                                <span className={["w-1.5 h-1.5 rounded-full shrink-0", style.dot].join(" ")} />
                                                {style.label}
                                            </span>
                                        </div>
                                        <p className="text-xs text-offgray-500 leading-relaxed">{rule.description}</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </section>
            ))}

            {/* Footer */}
            <section className="border-t border-white/[0.06] pt-6 pb-4 space-y-3">
                <p className="text-xs text-offgray-600 leading-relaxed max-w-xl">
                    Last updated: February 2026. Rules are subject to change at any time. Continued use of scripthub.id constitutes acceptance of the current rules. If you believe content violates these rules, use the report function on the relevant page.
                </p>
                <p className="text-xs text-offgray-600 leading-relaxed max-w-xl">
                    For questions about specific rules, appeals, or DMCA takedown requests, contact us through the support channel on our Discord server.
                </p>
            </section>
        </div>
    );
}
