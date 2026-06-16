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
  { phase: 0, key: "name", text: "Hey there! 👋 I'm Frost, your project guide at Market Open Media.\n\nI'm going to ask you a few questions so our team can build something truly amazing for your business. It only takes a few minutes and it makes a huge difference.\n\nLet's kick things off — what's your name?" },
  { phase: 0, key: "business_name", text: (a: Record<string,string>) => `${a.name}, love that name! 😄\n\nWhat's the name of your business or project?` },
  { phase: 0, key: "business_description", text: (a: Record<string,string>) => `Ooh, ${a.business_name} — already sounds interesting! ✨\n\nTell me a bit more about it. What do you offer and who do you help? Don't worry about being formal — just tell me like you'd explain it to a friend.` },
  { phase: 0, key: "target_audience", text: (a: Record<string,string>) => `I love that! ${a.business_name} sounds like exactly the kind of business that deserves a great online presence.\n\nNow — who are your ideal customers? Tell me about them. Industry, location, age range, what problems they bring to you... the more specific, the better!` },
  { phase: 1, key: "website_type", text: "Perfect, that gives me a great picture. 🙌\n\nNow let's talk about the website. What type are you looking for?\n\n→ Landing page (single page, one focused goal)\n→ Full website (multiple pages)\n→ E-commerce (online store)\n→ Portfolio\n→ Something else — just describe it!" },
  { phase: 1, key: "website_goal", text: (a: Record<string,string>) => `Great choice! A ${a.website_type} can do wonders for a business like yours.\n\nWhat's the #1 thing you want visitors to do when they land on it? (e.g. call you, fill a form, buy something, book a call...)` },
  { phase: 1, key: "pages", text: "Love it — clear goals make for great websites! 🎯\n\nHow many pages do you think you'll need? Even a rough idea is totally fine.\n(e.g. Home, About, Services, Contact — or just one killer landing page)" },
  { phase: 1, key: "features", text: "Got it! Now let's talk features — what do you need the site to actually do?\n\n→ Contact form\n→ Online booking / calendar\n→ Online store / payments\n→ Blog or news section\n→ Photo or video gallery\n→ Live chat\n→ Multilingual\n→ Something else?\n\nMention everything — nothing is too small!" },
  { phase: 2, key: "inspiration_sites", text: "Now here's the fun part — let's talk design! 🎨\n\nAre there any websites you love the look or feel of? Could be a competitor, a brand you admire, or just something you thought 'I want mine to look like THIS.' Drop the links or names, and tell me what you like about them." },
  { phase: 2, key: "vibe", text: (a: Record<string,string>) => `Ooh nice taste! ${a.inspiration_sites ? "Those are great references." : ""}\n\nHow would you describe the overall vibe you're going for?\n\nExamples: Modern & minimal / Bold & creative / Corporate & professional / Warm & approachable / Luxury & premium / Dark & dramatic\n\nOr just use your own words — I love a good vibe description! 😄` },
  { phase: 2, key: "colors", text: "Yes! That vibe is everything. 🙌\n\nDo you have brand colors already? Share the hex codes or just describe them.\n\nIf you haven't decided yet — what colors feel right for your brand? Don't overthink it, even 'something warm and earthy' helps!" },
  { phase: 2, key: "imagery", text: "Colors noted! 🎨\n\nWhat about visuals — what kind of imagery fits your brand?\n\nReal photography? Illustrations? Clean icons? Video backgrounds? Do you have photos already or will we need to source them? Light aesthetic or dark? Give me a sense of your visual world." },
  { phase: 2, key: "logo", text: "Getting a really clear picture now — I'm excited about this one! 😊\n\nOne more style question: do you already have a logo and brand identity?\n\nIf yes — great, we'll build around it. If not — would you like us to create one as part of the project?" },
  { phase: 3, key: "services", text: "Alright, let's get into the good stuff — what you actually offer! 🏢\n\nLet's go one service at a time so we capture everything properly.\n\nWhat's the name of your first service or product?" },
  { phase: 3, key: "process_contact", text: "Amazing — you've got a solid lineup! 💪\n\nNow let's talk about how you work with clients. This helps us design a site that sets the right expectations from the start.\n\nHow does a new client typically first reach out to you? (phone, form, DM, referral, walk-in...?)" },
  { phase: 3, key: "process_estimate", text: "Got it! And when it comes to that first consultation or estimate — is it free, or do you charge for it?\n\nTell me how that works." },
  { phase: 3, key: "process_onboarding", text: (a: Record<string,string>) => `${a.process_estimate?.toLowerCase().includes("free") ? "A free estimate — smart, clients love that! 🙌" : "Interesting approach!"}\n\nWhat happens after a client says yes and decides to move forward?\n\nWalk me through your onboarding — contracts, deposits, kickoff calls, anything like that.` },
  { phase: 3, key: "process_delivery", text: "Love the process! Almost like a well-oiled machine. ⚙️\n\nLast piece — how do you deliver the final result to your client? And do you offer any follow-up, guarantee, or aftercare?" },
  { phase: 3, key: "differentiators", text: (a: Record<string,string>) => `This is really shaping up! I feel like I already know ${a.business_name} pretty well. 😄\n\nLast question in this section — what makes you different from your competitors?\n\nWhy do clients pick YOU over everyone else? What do you do better, faster, or differently?` },
  { phase: 4, key: "contact_info", text: (a: Record<string,string>) => `Before we wrap up the details, I need your contact info so our team can reach you! 📬\n\nWhat's the best way to get in touch with you, ${a.name}?\n\nPlease share:\n→ Your email address\n→ Your phone number\n→ Your main social media profiles (Instagram, Facebook, LinkedIn, etc.)` },
  { phase: 4, key: "content", text: "You're doing great — almost there! 🎉\n\nLet's talk content. Do you already have the text/copy written for the website, or will you need help with that?\n\nAnd what about photos — do you have professional images, or will we need to source or create them?" },
  { phase: 4, key: "domain", text: "Perfect! Do you already have a domain name? (e.g. yourbusiness.com)\n\nAnd do you have hosting set up, or will you need that handled too?" },
  { phase: 4, key: "competitors", text: "Great! One thing that really helps us build a standout site — knowing who you're up against.\n\nWho are your main competitors online? Drop their URLs if you can. We'll make sure your site leaves them in the dust. 😎" },
  { phase: 4, key: "timeline", text: "Ha — noted! 😄\n\nWhat's your ideal timeline for launching the new site?\n\n→ ASAP — I needed this yesterday\n→ About 1 month\n→ 2–3 months\n→ No rush — I want it done right" },
  { phase: 4, key: "budget", text: "Almost done, I promise! Just one more. 🙏\n\nWhat's your budget range for this project?\n\n→ Under $1,000\n→ $1,000 – $3,000\n→ $3,000 – $7,000\n→ $7,000+\n→ Not sure yet — open to a proposal\n\nNo wrong answer here — this just helps us put together the right recommendation for you." },
  { phase: 4, key: "extra", text: (a: Record<string,string>) => `${a.name}, you've been amazing to chat with! 🧊✨\n\nLast thing — is there anything else you want the Market Open Media team to know? Any specific requests, things that are non-negotiable, or anything that didn't come up?\n\n(Or just say 'all good' and we're done!)` },
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
How clients reach out: ${answers.process_contact || "—"}
Consultation / estimate: ${answers.process_estimate || "—"}
Onboarding process: ${answers.process_onboarding || "—"}
Delivery & aftercare: ${answers.process_delivery || "—"}
What makes them different: ${answers.differentiators || "—"}

📋 PROJECT DETAILS
Contact info (email / phone / social): ${answers.contact_info || "—"}
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
  const mailtoHref = `mailto:marketopenmedia@gmail.com?subject=New project inquiry — ${answers.business_name || "Website project"}&body=${encodeURIComponent(summary)}`;

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
        <div className="flex-1 overflow-y-auto px-5 py-5 flex flex-col gap-4" style={{ scrollbarWidth: "none" }}>
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
