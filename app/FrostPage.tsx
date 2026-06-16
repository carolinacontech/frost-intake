"use client";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";

type Particle = { width: number; height: number; left: string; top: string; color: string; duration: number; delay: number };
type Message = { role: "assistant" | "user"; text: string };

const PHASES = [
  { label: "About you", icon: "👤" },
  { label: "The website", icon: "🌐" },
  { label: "Style & vision", icon: "🎨" },
  { label: "Your business", icon: "🏢" },
  { label: "Project details", icon: "📋" },
];

// "services" key triggers the service loop — handled separately
const QUESTIONS = [
  { phase: 0, key: "name", text: "Hi! I'm Frost, Market Open Media's project assistant 🧊\n\nI'll walk you through a few questions so our team can build the perfect website for your business. Ready? Let's start — what's your name?" },
  { phase: 0, key: "business_name", text: (a: Record<string,string>) => `Great to meet you, ${a.name}! 👋\n\nWhat's the name of your business or project?` },
  { phase: 0, key: "business_description", text: (a: Record<string,string>) => `Love it — ${a.business_name}! ✨\n\nIn a few sentences, tell me what ${a.business_name} does. What do you offer and who do you help?` },
  { phase: 0, key: "target_audience", text: "Who are your ideal customers? Tell me about them — industry, location, age range, or the type of problem they come to you to solve." },
  { phase: 1, key: "website_type", text: "Now let's talk about the website itself.\n\nWhat type do you need?\n→ Landing page (single page, one focused goal)\n→ Full website (multiple pages)\n→ E-commerce (online store)\n→ Portfolio\n→ Something else — describe it!" },
  { phase: 1, key: "website_goal", text: "What's the #1 goal of the website? What do you want visitors to do when they arrive?\n\n(e.g. call you, fill out a form, buy a product, book a consultation...)" },
  { phase: 1, key: "pages", text: "How many pages do you think you'll need? Even a rough idea helps.\n\n(e.g. Home, About, Services, Contact — or just one powerful landing page)" },
  { phase: 1, key: "features", text: "What features do you need? Mention everything that comes to mind:\n→ Contact form\n→ Online booking / calendar\n→ Online store / payments\n→ Blog or news section\n→ Photo or video gallery\n→ Live chat\n→ Multilingual\n→ Other?" },
  { phase: 2, key: "inspiration_sites", text: "Now the fun part 🎨\n\nShare 2–3 websites you love the look or feel of — yours or from any industry. What specifically do you like about them?" },
  { phase: 2, key: "vibe", text: "How would you describe the vibe you want for your site?\n\nExamples: Modern & minimal / Bold & creative / Corporate & professional / Warm & approachable / Luxury & premium / Dark & dramatic\n\nOr describe it in your own words!" },
  { phase: 2, key: "colors", text: "Do you have brand colors? Share the hex codes or describe them.\n\nIf you don't have any yet — what colors feel right for your brand?" },
  { phase: 2, key: "imagery", text: "What kind of visuals fit your brand?\n\nReal photography, illustrations, icons, video backgrounds, 3D? Light or dark aesthetic? Do you have existing photos or will you need them sourced?" },
  { phase: 2, key: "logo", text: "Do you already have a logo and brand identity?\n\nIf yes — great, we'll work with it. If not — would you like us to create one as part of the project?" },
  // SERVICE LOOP starts here — handled by serviceMode state
  { phase: 3, key: "services", text: "Now let's build out your services. 🏢\n\nLet's go one by one. What's the name of your first service or product?" },
  { phase: 3, key: "client_process", text: "Walk me through your process for taking on a new client — from first contact to completed job.\n\n→ How does a client first reach out to you?\n→ Do you offer a free consultation or estimate, or is there a fee?\n→ What happens after they agree?\n→ How do you deliver the final result?" },
  { phase: 3, key: "differentiators", text: "What makes you different from your competitors?\n\nWhy do clients choose you over others? What do you do better, faster, or differently?" },
  { phase: 4, key: "content", text: "For the website content — do you have the copy (text) written, or will you need help writing it?\n\nAnd do you have professional photos, or will we need to source or create them?" },
  { phase: 4, key: "domain", text: "Do you have a domain name already? (e.g. yourbusiness.com)\n\nAnd do you have hosting set up, or will you need that too?" },
  { phase: 4, key: "competitors", text: "Who are your main competitors online? Drop their website URLs if you can.\n\nThis helps us make sure your site stands out in your market." },
  { phase: 4, key: "timeline", text: "What's your ideal timeline for launch?\n\n→ ASAP (rush project)\n→ 1 month\n→ 2–3 months\n→ No hard deadline — quality over speed" },
  { phase: 4, key: "budget", text: "And the last question — what's your budget range for this project?\n\n→ Under $1,000\n→ $1,000 – $3,000\n→ $3,000 – $7,000\n→ $7,000+\n→ Not sure yet — open to a proposal\n\nNo wrong answer. This helps us tailor the right solution for you." },
  { phase: 4, key: "extra", text: "Almost done! 🎉\n\nAnything else you'd like the Market Open Media team to know? Any specific requests, non-negotiables, or things that didn't come up?" },
];

// Service loop sub-steps
type ServiceStep = "name" | "description" | "price" | "another";

function buildSummary(answers: Record<string, string>): string {
  return `MARKET OPEN MEDIA — NEW PROJECT INQUIRY
========================================

👤 ABOUT THE CLIENT
Name: ${answers.name || "—"}
Business: ${answers.business_name || "—"}
Description: ${answers.business_description || "—"}
Target audience: ${answers.target_audience || "—"}

🌐 THE WEBSITE
Type: ${answers.website_type || "—"}
Main goal: ${answers.website_goal || "—"}
Pages needed: ${answers.pages || "—"}
Features: ${answers.features || "—"}

🎨 STYLE & VISION
Inspiration websites: ${answers.inspiration_sites || "—"}
Vibe: ${answers.vibe || "—"}
Colors: ${answers.colors || "—"}
Imagery: ${answers.imagery || "—"}
Logo/Brand: ${answers.logo || "—"}

🏢 THEIR BUSINESS
${answers.services_list || "—"}
Client process & estimates: ${answers.client_process || "—"}
What makes them different: ${answers.differentiators || "—"}

📋 PROJECT DETAILS
Content/Copy: ${answers.content || "—"}
Domain/Hosting: ${answers.domain || "—"}
Competitors: ${answers.competitors || "—"}
Timeline: ${answers.timeline || "—"}
Budget: ${answers.budget || "—"}
Extra notes: ${answers.extra || "—"}

========================================
Sent from Market Open Media — Frost intake page`.trim();
}

export default function FrostPage() {
  const [particles, setParticles] = useState<Particle[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [step, setStep] = useState(0);
  const [input, setInput] = useState("");
  const [done, setDone] = useState(false);
  const [copied, setCopied] = useState(false);

  // Service loop state
  const [serviceMode, setServiceMode] = useState(false);
  const [serviceStep, setServiceStep] = useState<ServiceStep>("name");
  const [serviceCount, setServiceCount] = useState(0);
  const [currentService, setCurrentService] = useState<{ name: string; description: string; price: string }>({ name: "", description: "", price: "" });

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const currentQ = QUESTIONS[step];
  const currentPhase = serviceMode ? 3 : (currentQ?.phase ?? 4);
  const progress = Math.round((step / QUESTIONS.length) * 100);

  useEffect(() => {
    setParticles(Array.from({ length: 12 }, (_, i) => ({
      width: Math.random() * 3 + 1,
      height: Math.random() * 3 + 1,
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      color: i % 3 === 0 ? "var(--aurora-teal)" : "var(--aurora-light)",
      duration: 4 + Math.random() * 4,
      delay: Math.random() * 4,
    })));
    setTimeout(() => {
      const firstQ = QUESTIONS[0];
      setMessages([{ role: "assistant", text: typeof firstQ.text === "function" ? firstQ.text({}) : firstQ.text }]);
    }, 600);
  }, []);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);
  useEffect(() => { setTimeout(() => inputRef.current?.focus(), 300); }, [step, serviceStep]);

  const addMessage = (text: string) => {
    setTimeout(() => setMessages(prev => [...prev, { role: "assistant", text }]), 500);
  };

  const advanceToNextQuestion = (nextStep: number, newAnswers: Record<string, string>) => {
    if (nextStep >= QUESTIONS.length) {
      setTimeout(() => {
        setMessages(prev => [...prev, {
          role: "assistant",
          text: `That's everything I need! 🧊✨\n\nI've put together a full brief for the Market Open Media team. They'll review it and reach out to you shortly.\n\nClick below to send your brief — or copy it to keep a record.`,
        }]);
        setDone(true);
      }, 500);
    } else {
      setTimeout(() => {
        const nextQ = QUESTIONS[nextStep];
        const text = typeof nextQ.text === "function" ? nextQ.text(newAnswers) : nextQ.text;
        setMessages(prev => [...prev, { role: "assistant", text }]);
        setStep(nextStep);
      }, 500);
    }
  };

  const sendAnswer = () => {
    const trimmed = input.trim();
    if (!trimmed) return;
    setMessages(prev => [...prev, { role: "user", text: trimmed }]);
    setInput("");

    // SERVICE LOOP
    if (serviceMode) {
      const num = serviceCount + 1;

      if (serviceStep === "name") {
        setCurrentService({ name: trimmed, description: "", price: "" });
        setServiceStep("description");
        addMessage(`Got it — "${trimmed}". Now give me a brief description of this service. What does it include?`);

      } else if (serviceStep === "description") {
        setCurrentService(prev => ({ ...prev, description: trimmed }));
        setServiceStep("price");
        addMessage(`Perfect. What's the price or price range for this service? (If it varies, just give a rough range or say "quote-based")`);

      } else if (serviceStep === "price") {
        const svc = { ...currentService, price: trimmed };
        const entry = `Service ${num}: ${svc.name}\nDescription: ${svc.description}\nPrice: ${svc.price}`;
        const newList = answers.services_list ? `${answers.services_list}\n\n${entry}` : entry;
        const newAnswers = { ...answers, services_list: newList };
        setAnswers(newAnswers);
        setServiceCount(num);
        setServiceStep("another");
        addMessage(`Got it! ✅\n\nDo you have another service to add? (yes / no)`);

      } else if (serviceStep === "another") {
        const answer = trimmed.toLowerCase();
        if (answer === "yes" || answer === "si" || answer === "sí" || answer === "y") {
          setServiceStep("name");
          addMessage(`Great! What's the name of your next service?`);
        } else {
          // Exit service loop, go to next question after "services"
          setServiceMode(false);
          const servicesIndex = QUESTIONS.findIndex(q => q.key === "services");
          advanceToNextQuestion(servicesIndex + 1, answers);
        }
      }
      return;
    }

    // NORMAL FLOW
    const newAnswers = { ...answers, [currentQ.key]: trimmed };
    setAnswers(newAnswers);

    // Entering service loop
    if (currentQ.key === "services") {
      setServiceMode(true);
      setServiceStep("description");
      setServiceCount(0);
      setCurrentService({ name: trimmed, description: "", price: "" });
      addMessage(`Got it — "${trimmed}". Now give me a brief description of this service. What does it include?`);
      return;
    }

    advanceToNextQuestion(step + 1, newAnswers);
  };

  const summary = buildSummary(answers);
  const mailtoHref = `mailto:carolina@carolinaconte.com?subject=New project inquiry — ${answers.business_name || "Website project"}&body=${encodeURIComponent(summary)}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center"
      style={{ background: "var(--night)" }}>

      {/* Background */}
      <div className="absolute inset-0 z-0">
        <Image src="/ice-macro.png" alt="" fill className="object-cover opacity-10" />
        <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse 80% 60% at 50% 40%, rgba(83,74,183,0.18) 0%, transparent 70%)" }} />
        <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse 60% 40% at 20% 80%, rgba(93,202,165,0.08) 0%, transparent 60%)" }} />
      </div>

      {/* Particles */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        {particles.map((p, i) => (
          <motion.div key={i} className="absolute rounded-full"
            style={{ width: p.width, height: p.height, left: p.left, top: p.top, background: p.color, opacity: 0.3 }}
            animate={{ y: [-20, 20, -20], opacity: [0.1, 0.4, 0.1] }}
            transition={{ duration: p.duration, repeat: Infinity, delay: p.delay, ease: "easeInOut" }} />
        ))}
      </div>

      {/* Chat card */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative z-10 flex flex-col w-full mx-4"
        style={{
          maxWidth: 480,
          height: "min(720px, 90vh)",
          background: "rgba(10,13,31,0.85)",
          border: "1px solid rgba(83,74,183,0.35)",
          borderRadius: 24,
          backdropFilter: "blur(24px)",
          boxShadow: "0 40px 80px rgba(0,0,0,0.5), 0 0 60px rgba(83,74,183,0.12)",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 shrink-0"
          style={{ borderBottom: "1px solid rgba(83,74,183,0.2)" }}>
          <div className="flex items-center gap-3">
            <motion.div className="w-10 h-10 rounded-full overflow-hidden shrink-0"
              style={{ border: "1.5px solid rgba(175,169,236,0.4)", boxShadow: "0 0 20px rgba(83,74,183,0.4)" }}
              animate={{ boxShadow: ["0 0 20px rgba(83,74,183,0.3)", "0 0 35px rgba(83,74,183,0.6)", "0 0 20px rgba(83,74,183,0.3)"] }}
              transition={{ duration: 3, repeat: Infinity }}>
              <Image src="/frost-avatar.png" alt="Frost" width={40} height={40} className="object-cover" />
            </motion.div>
            <div>
              <p className="font-semibold text-sm" style={{ color: "var(--snow)" }}>Frost</p>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: "var(--aurora-teal)" }} />
                <p className="text-xs" style={{ color: "var(--aurora-teal)" }}>Online · Market Open Media</p>
              </div>
            </div>
          </div>
          {/* Phase dots */}
          <div className="flex gap-1.5">
            {PHASES.map((_, i) => (
              <motion.div key={i} className="h-1.5 rounded-full transition-all duration-500"
                style={{ width: i === currentPhase ? 20 : 6, background: i <= currentPhase ? "var(--aurora)" : "rgba(83,74,183,0.2)" }} />
            ))}
          </div>
        </div>

        {/* Progress */}
        <div className="px-5 py-3 shrink-0">
          <div className="w-full h-px rounded-full" style={{ background: "rgba(83,74,183,0.15)" }}>
            <motion.div className="h-full rounded-full"
              style={{ background: "linear-gradient(90deg, var(--aurora), var(--aurora-teal))" }}
              animate={{ width: `${progress}%` }} transition={{ duration: 0.5 }} />
          </div>
          <div className="flex justify-between mt-1.5">
            <span className="text-xs" style={{ color: "rgba(175,169,236,0.4)" }}>{PHASES[currentPhase]?.icon} {PHASES[currentPhase]?.label}</span>
            <span className="text-xs" style={{ color: "rgba(175,169,236,0.4)" }}>{progress}%</span>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-5 py-2 flex flex-col gap-4" style={{ scrollbarWidth: "none" }}>
          <AnimatePresence initial={false}>
            {messages.map((m, i) => (
              <motion.div key={i}
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}
                className={`flex items-end gap-2.5 ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                {m.role === "assistant" && (
                  <div className="w-7 h-7 rounded-full overflow-hidden shrink-0 mb-0.5"
                    style={{ border: "1px solid rgba(175,169,236,0.3)" }}>
                    <Image src="/frost-avatar.png" alt="Frost" width={28} height={28} className="object-cover" />
                  </div>
                )}
                <div className="px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-line"
                  style={{
                    maxWidth: "78%",
                    ...(m.role === "assistant"
                      ? { background: "rgba(83,74,183,0.14)", color: "var(--snow)", border: "1px solid rgba(83,74,183,0.22)", borderBottomLeftRadius: 4 }
                      : { background: "linear-gradient(135deg, var(--aurora), #6B5CE7)", color: "var(--snow)", borderBottomRightRadius: 4, boxShadow: "0 4px 20px rgba(83,74,183,0.3)" }),
                  }}>
                  {m.text}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          <div ref={bottomRef} />
        </div>

        {/* Input / Done */}
        <div className="px-5 pb-5 pt-3 shrink-0">
          {done ? (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-3">
              <a href={mailtoHref}
                className="w-full py-3.5 rounded-full font-semibold text-sm text-center block transition-transform hover:scale-[1.02]"
                style={{ background: "linear-gradient(135deg, var(--aurora), #6B5CE7)", color: "var(--snow)", boxShadow: "0 0 40px rgba(83,74,183,0.45)" }}>
                📨 Send my brief to Market Open Media
              </a>
              <button onClick={handleCopy}
                className="w-full py-3.5 rounded-full font-semibold text-sm text-center transition-all"
                style={{ background: "rgba(83,74,183,0.12)", color: copied ? "var(--aurora-teal)" : "var(--aurora-light)", border: `1px solid ${copied ? "rgba(93,202,165,0.4)" : "rgba(83,74,183,0.25)"}` }}>
                {copied ? "✓ Copied!" : "📋 Copy brief to clipboard"}
              </button>
            </motion.div>
          ) : (
            <div className="flex gap-2 items-center"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(83,74,183,0.25)", borderRadius: 99, padding: "6px 6px 6px 18px", backdropFilter: "blur(12px)" }}>
              <input ref={inputRef} value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendAnswer(); } }}
                placeholder="Type your answer..."
                className="flex-1 bg-transparent text-sm outline-none"
                style={{ color: "var(--snow)" }} />
              <motion.button onClick={sendAnswer} whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.94 }}
                className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-sm font-bold"
                style={{ background: input.trim() ? "linear-gradient(135deg, var(--aurora), #6B5CE7)" : "rgba(83,74,183,0.2)", color: "var(--snow)", transition: "background 0.2s", boxShadow: input.trim() ? "0 0 20px rgba(83,74,183,0.4)" : "none" }}>
                →
              </motion.button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
