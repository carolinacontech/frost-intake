"use client";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";

type Particle = { width: number; height: number; left: string; top: string; color: string; duration: number; delay: number };
type Message = { role: "assistant" | "user"; text: string };
type Lang = "en" | "es";
type ServiceStep = "name" | "description" | "price" | "another";

// ─── PHASES ───────────────────────────────────────────────────────────────────
const PHASES = {
  en: [
    { label: "About you", icon: "👤" },
    { label: "The website", icon: "🌐" },
    { label: "Style & vision", icon: "🎨" },
    { label: "Your business", icon: "🏢" },
    { label: "Project details", icon: "📋" },
  ],
  es: [
    { label: "Sobre ti", icon: "👤" },
    { label: "El sitio web", icon: "🌐" },
    { label: "Estilo y visión", icon: "🎨" },
    { label: "Tu negocio", icon: "🏢" },
    { label: "Detalles", icon: "📋" },
  ],
};

// ─── QUESTIONS ────────────────────────────────────────────────────────────────
const QUESTIONS = {
  en: [
    { phase: 0, key: "name", text: "Hey there! 👋 I'm Blu, your project guide at Market Open Media.\n\nI'm going to ask you a few questions so our team can build something truly amazing for your business. It only takes a few minutes!\n\nLet's kick things off — what's your name?" },
    { phase: 0, key: "business_name", text: (a: Record<string,string>) => `${a.name}, love that name! 😄\n\nWhat's the name of your business or project?` },
    { phase: 0, key: "business_description", text: (a: Record<string,string>) => `Ooh, ${a.business_name} — already sounds interesting! ✨\n\nTell me a bit more about it. What do you offer and who do you help? Just tell me like you'd explain it to a friend.` },
    { phase: 0, key: "target_audience", text: (a: Record<string,string>) => `I love that! ${a.business_name} sounds like exactly the kind of business that deserves a great online presence.\n\nWho are your ideal customers? Industry, location, age range, what problems they bring to you... the more specific, the better!` },
    { phase: 1, key: "website_type", text: "Perfect, that gives me a great picture. 🙌\n\nNow let's talk about the website. What type are you looking for?\n\n→ Landing page (single page, one focused goal)\n→ Full website (multiple pages)\n→ E-commerce (online store)\n→ Portfolio\n→ Something else — just describe it!" },
    { phase: 1, key: "website_goal", text: (a: Record<string,string>) => `Great choice! A ${a.website_type} can do wonders for a business like yours.\n\nWhat's the #1 thing you want visitors to do when they land on it? (e.g. call you, fill a form, buy something, book a call...)` },
    { phase: 1, key: "pages", text: "Love it — clear goals make for great websites! 🎯\n\nHow many pages do you think you'll need? Even a rough idea is totally fine.\n(e.g. Home, About, Services, Contact — or just one killer landing page)" },
    { phase: 1, key: "features", text: "Got it! Now let's talk features — what do you need the site to actually do?\n\n→ Contact form\n→ Online booking / calendar\n→ Online store / payments\n→ Blog or news section\n→ Photo or video gallery\n→ Live chat\n→ Multilingual\n→ Something else?\n\nMention everything — nothing is too small!" },
    { phase: 2, key: "inspiration_sites", text: "Now here's the fun part — let's talk design! 🎨\n\nAre there any websites you love the look or feel of? Drop the links or names, and tell me what you like about them." },
    { phase: 2, key: "vibe", text: (a: Record<string,string>) => `Ooh nice taste! ${a.inspiration_sites ? "Those are great references." : ""}\n\nHow would you describe the overall vibe you're going for?\n\nExamples: Modern & minimal / Bold & creative / Corporate & professional / Warm & approachable / Luxury & premium / Dark & dramatic\n\nOr just use your own words! 😄` },
    { phase: 2, key: "colors", text: "Yes! That vibe is everything. 🙌\n\nDo you have brand colors already? Share the hex codes or just describe them.\n\nIf not — what colors feel right for your brand? Even 'something warm and earthy' helps!" },
    { phase: 2, key: "imagery", text: "Colors noted! 🎨\n\nWhat kind of imagery fits your brand?\n\nReal photography? Illustrations? Clean icons? Video backgrounds? Do you have photos already or will we need to source them?" },
    { phase: 2, key: "logo", text: "Getting a really clear picture now — I'm excited about this one! 😊\n\nDo you already have a logo and brand identity?\n\nIf yes — great, we'll build around it. If not — would you like us to create one too?" },
    { phase: 3, key: "services", text: "Alright, let's get into the good stuff — what you actually offer! 🏢\n\nLet's go one service at a time.\n\nWhat's the name of your first service or product?" },
    { phase: 3, key: "process_contact", text: "Amazing — you've got a solid lineup! 💪\n\nNow let's talk about how you work with clients.\n\nHow does a new client typically first reach out to you? (phone, form, DM, referral, walk-in...?)" },
    { phase: 3, key: "process_estimate", text: "Got it! And when it comes to that first consultation or estimate — is it free, or do you charge for it?\n\nTell me how that works." },
    { phase: 3, key: "process_onboarding", text: (a: Record<string,string>) => `${a.process_estimate?.toLowerCase().includes("free") ? "A free estimate — smart, clients love that! 🙌" : "Interesting approach!"}\n\nWhat happens after a client says yes?\n\nWalk me through your onboarding — contracts, deposits, kickoff calls, anything like that.` },
    { phase: 3, key: "process_delivery", text: "Love the process! Almost like a well-oiled machine. ⚙️\n\nHow do you deliver the final result to your client? And do you offer any follow-up, guarantee, or aftercare?" },
    { phase: 3, key: "differentiators", text: (a: Record<string,string>) => `This is really shaping up! I feel like I already know ${a.business_name} pretty well. 😄\n\nWhat makes you different from your competitors?\n\nWhy do clients pick YOU over everyone else?` },
    { phase: 4, key: "contact_email", text: (a: Record<string,string>) => `Before we wrap up, I need your contact info so our team can reach you! 📬\n\nWhat's your email address, ${a.name}?` },
    { phase: 4, key: "contact_phone", text: "Perfect! And what's the best phone number to reach you?" },
    { phase: 4, key: "contact_social", text: "Last contact question — what are your social media profiles? (Instagram, Facebook, LinkedIn, TikTok...)\n\nJust drop the handles or URLs!" },
    { phase: 4, key: "content", text: "You're doing great — almost there! 🎉\n\nDo you already have the text/copy written for the website, or will you need help with that?\n\nAnd what about photos — do you have professional images, or will we need to source them?" },
    { phase: 4, key: "domain", text: "Perfect! Do you already have a domain name? (e.g. yourbusiness.com)\n\nAnd do you have hosting set up, or will you need that handled too?" },
    { phase: 4, key: "competitors", text: "Great! Who are your main competitors online? Drop their URLs if you can.\n\nWe'll make sure your site leaves them in the dust. 😎" },
    { phase: 4, key: "timeline", text: "What's your ideal timeline for launching the new site?\n\n→ ASAP — I needed this yesterday\n→ About 1 month\n→ 2–3 months\n→ No rush — I want it done right" },
    { phase: 4, key: "extra", text: (a: Record<string,string>) => `${a.name}, you've been amazing to chat with! 🌊✨\n\nIs there anything else you want the Market Open Media team to know? Any requests, non-negotiables, or anything that didn't come up?\n\n(Or just say 'all good' and we're almost done!)` },
    { phase: 4, key: "reference_files", text: "Last thing! 📎\n\nDo you have any reference images, inspiration screenshots, mockups, or any other file you'd like to share with our team?\n\nIf yes, use the upload button below to attach them. If not, just say 'no' and we're done!" },
  ],
  es: [
    { phase: 0, key: "name", text: "¡Hola! 👋 Soy Blu, tu guía de proyectos en Market Open Media.\n\nVoy a hacerte algunas preguntas para que nuestro equipo pueda crear algo increíble para tu negocio. ¡Solo toma unos minutos!\n\nEmpecemos — ¿cómo te llamas?" },
    { phase: 0, key: "business_name", text: (a: Record<string,string>) => `¡${a.name}, qué nombre tan genial! 😄\n\n¿Cómo se llama tu negocio o proyecto?` },
    { phase: 0, key: "business_description", text: (a: Record<string,string>) => `¡Ooh, ${a.business_name} — ya suena interesante! ✨\n\nCuéntame un poco más. ¿Qué ofreces y a quién ayudas? No te preocupes por ser formal — cuéntamelo como se lo explicarías a un amigo.` },
    { phase: 0, key: "target_audience", text: (a: Record<string,string>) => `¡Me encanta! ${a.business_name} suena exactamente como el tipo de negocio que merece una gran presencia online.\n\n¿Quiénes son tus clientes ideales? Industria, ubicación, rango de edad, qué problemas te traen... ¡mientras más específico, mejor!` },
    { phase: 1, key: "website_type", text: "Perfecto, eso me da una imagen muy clara. 🙌\n\nAhora hablemos del sitio web. ¿Qué tipo necesitas?\n\n→ Landing page (una sola página, un objetivo claro)\n→ Sitio web completo (varias páginas)\n→ Tienda en línea (e-commerce)\n→ Portafolio\n→ Algo diferente — ¡descríbelo!" },
    { phase: 1, key: "website_goal", text: (a: Record<string,string>) => `¡Excelente elección! Un ${a.website_type} puede hacer maravillas para un negocio como el tuyo.\n\n¿Cuál es la acción #1 que quieres que hagan los visitantes cuando lleguen? (ej: llamarte, llenar un formulario, comprar, agendar una llamada...)` },
    { phase: 1, key: "pages", text: "¡Me encanta — los objetivos claros hacen grandes sitios web! 🎯\n\n¿Cuántas páginas crees que necesitarás? Una idea aproximada está bien.\n(ej: Inicio, Sobre nosotros, Servicios, Contacto — o solo una landing page poderosa)" },
    { phase: 1, key: "features", text: "¡Entendido! Ahora hablemos de funciones — ¿qué necesitas que haga el sitio?\n\n→ Formulario de contacto\n→ Reservas / calendario en línea\n→ Tienda / pagos en línea\n→ Blog o noticias\n→ Galería de fotos o video\n→ Chat en vivo\n→ Multilenguaje\n→ ¿Algo más?\n\n¡Menciona todo — nada es demasiado pequeño!" },
    { phase: 2, key: "inspiration_sites", text: "¡Ahora viene la parte divertida — hablemos de diseño! 🎨\n\n¿Hay algún sitio web que te encante por su look o sensación? Comparte los links o nombres, y cuéntame qué te gusta de ellos." },
    { phase: 2, key: "vibe", text: (a: Record<string,string>) => `¡Qué buen gusto! ${a.inspiration_sites ? "Esas son excelentes referencias." : ""}\n\n¿Cómo describirías el ambiente general que buscas?\n\nEjemplos: Moderno y minimalista / Atrevido y creativo / Corporativo y profesional / Cálido y cercano / Lujoso y premium / Oscuro y dramático\n\n¡O usa tus propias palabras! 😄` },
    { phase: 2, key: "colors", text: "¡Sí! Ese ambiente lo es todo. 🙌\n\n¿Ya tienes colores de marca? Comparte los códigos hex o descríbelos.\n\nSi aún no los tienes — ¿qué colores se sienten correctos para tu marca? ¡Incluso 'algo cálido y terroso' ayuda!" },
    { phase: 2, key: "imagery", text: "¡Colores anotados! 🎨\n\n¿Qué tipo de imágenes encajan con tu marca?\n\n¿Fotografía real? ¿Ilustraciones? ¿Íconos? ¿Videos de fondo? ¿Ya tienes fotos o necesitamos conseguirlas?" },
    { phase: 2, key: "logo", text: "¡Cada vez tengo una imagen más clara — este proyecto me emociona! 😊\n\n¿Ya tienes un logo e identidad de marca?\n\nSi sí — perfecto, construiremos alrededor de él. Si no — ¿te gustaría que lo creáramos también?" },
    { phase: 3, key: "services", text: "¡Muy bien, vamos a lo bueno — lo que realmente ofreces! 🏢\n\nVamos servicio por servicio para capturar todo bien.\n\n¿Cuál es el nombre de tu primer servicio o producto?" },
    { phase: 3, key: "process_contact", text: "¡Increíble — tienes una oferta sólida! 💪\n\nAhora hablemos de cómo trabajas con tus clientes.\n\n¿Cómo te contacta un nuevo cliente por primera vez? (teléfono, formulario, DM, referido, presencial...?)" },
    { phase: 3, key: "process_estimate", text: "¡Entendido! Y cuando se trata de esa primera consulta o estimado — ¿es gratis, o cobras por ello?\n\nCuéntame cómo funciona eso." },
    { phase: 3, key: "process_onboarding", text: (a: Record<string,string>) => `${a.process_estimate?.toLowerCase().includes("grat") ? "¡Estimado gratis — muy inteligente, los clientes lo aman! 🙌" : "¡Interesante enfoque!"}\n\n¿Qué pasa después de que un cliente dice que sí?\n\nCuéntame tu proceso de incorporación — contratos, depósitos, llamadas de inicio, lo que sea.` },
    { phase: 3, key: "process_delivery", text: "¡Me encanta el proceso! Casi como una máquina bien engrasada. ⚙️\n\n¿Cómo le entregas el resultado final a tu cliente? ¿Ofreces seguimiento, garantía o atención post-venta?" },
    { phase: 3, key: "differentiators", text: (a: Record<string,string>) => `¡Esto está tomando muy buena forma! Siento que ya conozco bien ${a.business_name}. 😄\n\n¿Qué te hace diferente de tu competencia?\n\n¿Por qué los clientes te eligen a TI sobre todos los demás?` },
    { phase: 4, key: "contact_email", text: (a: Record<string,string>) => `Antes de terminar, necesito tu información de contacto para que nuestro equipo pueda comunicarse contigo! 📬\n\n¿Cuál es tu correo electrónico, ${a.name}?` },
    { phase: 4, key: "contact_phone", text: "¡Perfecto! ¿Y cuál es el mejor número de teléfono para contactarte?" },
    { phase: 4, key: "contact_social", text: "Última pregunta de contacto — ¿cuáles son tus redes sociales? (Instagram, Facebook, LinkedIn, TikTok...)\n\n¡Solo comparte los usuarios o URLs!" },
    { phase: 4, key: "content", text: "¡Lo estás haciendo genial — casi terminamos! 🎉\n\n¿Ya tienes el texto escrito para el sitio web, o necesitarás ayuda con eso?\n\n¿Y las fotos? ¿Tienes imágenes profesionales o necesitamos conseguirlas?" },
    { phase: 4, key: "domain", text: "¡Perfecto! ¿Ya tienes un nombre de dominio? (ej: tunegocio.com)\n\n¿Y tienes hosting contratado, o necesitarás que lo manejemos también?" },
    { phase: 4, key: "competitors", text: "¡Genial! ¿Quiénes son tus principales competidores en línea? Comparte sus URLs si puedes.\n\nNos aseguraremos de que tu sitio los deje atrás. 😎" },
    { phase: 4, key: "timeline", text: "¿Cuál es tu plazo ideal para lanzar el nuevo sitio?\n\n→ Lo antes posible — lo necesitaba ayer\n→ En 1 mes\n→ En 2–3 meses\n→ Sin prisa — quiero que quede perfecto" },
    { phase: 4, key: "extra", text: (a: Record<string,string>) => `¡${a.name}, ha sido un placer charlar contigo! 🌊✨\n\n¿Hay algo más que quieras que sepa el equipo de Market Open Media? ¿Alguna solicitud especial, algo no negociable, o algo que no hayamos tocado?\n\n(¡O simplemente di 'todo bien' y casi terminamos!)` },
    { phase: 4, key: "reference_files", text: "¡Última cosa! 📎\n\n¿Tienes imágenes de referencia, capturas de pantalla de inspiración, mockups, o cualquier otro archivo que quieras compartir con nuestro equipo?\n\nSi sí, usa el botón de abajo para adjuntarlos. ¡Si no, solo di 'no' y terminamos!" },
  ],
};

// ─── SERVICE LOOP MESSAGES ────────────────────────────────────────────────────
const SVC = {
  en: {
    description: (name: string) => `Got it — "${name}". Now give me a brief description of this service. What does it include?`,
    price: `Perfect. What's the price or price range for this service? (If it varies, just say "quote-based")`,
    another: `Got it! ✅\n\nDo you have another service to add? (yes / no)`,
    next: `Great! What's the name of your next service?`,
    label: (n: number, svc: { name: string; description: string; price: string }) =>
      `Service ${n}: ${svc.name}\nDescription: ${svc.description}\nPrice: ${svc.price}`,
  },
  es: {
    description: (name: string) => `¡Entendido — "${name}"! Ahora dame una breve descripción de este servicio. ¿Qué incluye?`,
    price: `Perfecto. ¿Cuál es el precio o rango de precios de este servicio? (Si varía, puedes decir "cotización")`,
    another: `¡Listo! ✅\n\n¿Tienes otro servicio para agregar? (sí / no)`,
    next: `¡Genial! ¿Cuál es el nombre de tu próximo servicio?`,
    label: (n: number, svc: { name: string; description: string; price: string }) =>
      `Servicio ${n}: ${svc.name}\nDescripción: ${svc.description}\nPrecio: ${svc.price}`,
  },
};

const DONE_MSG = {
  en: `That's everything I need! 🌊✨\n\nI've put together a full brief for the Market Open Media team. They'll review it and reach out to you shortly.\n\nClick below to send your brief — or copy it to keep a record.`,
  es: `¡Eso es todo lo que necesito! 🌊✨\n\nHe preparado un resumen completo para el equipo de Market Open Media. Lo revisarán y se pondrán en contacto contigo pronto.\n\nHaz clic abajo para enviar tu resumen — o cópialo para tus registros.`,
};

const UI = {
  en: {
    online: "Online · Market Open Media",
    placeholder: "Type your answer...",
    send: "Send my brief to Market Open Media",
    sending: "Sending...",
    sent: "✓ Brief sent! We'll be in touch soon.",
    sendError: "Something went wrong. Copy your brief and email us directly.",
    copy: "Copy brief to clipboard",
    copied: "✓ Copied!",
    meetBlu: "Meet Blu",
    tagline: "Your project guide at Market Open Media",
    start: "Let's get started →",
    selectLang: "Choose your language",
    attachFiles: "📎 Attach files (optional)",
    attachedFiles: "Attached files:",
    logoHint: "You can attach your logo or brand files here",
    referenceHint: "Attach any reference images, screenshots or files here",
  },
  es: {
    online: "En línea · Market Open Media",
    placeholder: "Escribe tu respuesta...",
    send: "Enviar mi resumen a Market Open Media",
    sending: "Enviando...",
    sent: "✓ ¡Resumen enviado! Nos pondremos en contacto pronto.",
    sendError: "Algo salió mal. Copia tu resumen y escríbenos directamente.",
    copy: "Copiar resumen al portapapeles",
    copied: "✓ ¡Copiado!",
    meetBlu: "Conoce a Blu",
    tagline: "Tu guía de proyectos en Market Open Media",
    start: "¡Empecemos →",
    selectLang: "Elige tu idioma",
    attachFiles: "📎 Adjuntar archivos (opcional)",
    attachedFiles: "Archivos adjuntos:",
    logoHint: "Puedes adjuntar tu logo o archivos de marca aquí",
    referenceHint: "Adjunta imágenes de referencia, capturas o archivos aquí",
  },
};

function buildSummary(answers: Record<string, string>): string {
  return `MARKET OPEN MEDIA — NEW PROJECT INQUIRY
========================================

👤 CLIENT INFO
Name: ${answers.name || "—"}
Email: ${answers.contact_email || "—"}
Phone: ${answers.contact_phone || "—"}
Social media: ${answers.contact_social || "—"}

🏢 THEIR BUSINESS
Business: ${answers.business_name || "—"}
Description: ${answers.business_description || "—"}
Target audience: ${answers.target_audience || "—"}

SERVICES:
${answers.services_list || "—"}

How clients reach out: ${answers.process_contact || "—"}
Consultation / estimate: ${answers.process_estimate || "—"}
Onboarding process: ${answers.process_onboarding || "—"}
Delivery & aftercare: ${answers.process_delivery || "—"}
What makes them different: ${answers.differentiators || "—"}

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

📋 PROJECT DETAILS
Content/Copy: ${answers.content || "—"}
Domain/Hosting: ${answers.domain || "—"}
Competitors: ${answers.competitors || "—"}
Timeline: ${answers.timeline || "—"}
Extra notes: ${answers.extra || "—"}
Reference files: ${answers.reference_files || "—"}

========================================
Sent from Market Open Media — Blu intake page`.trim();
}

export default function BluPage() {
  const [lang, setLang] = useState<Lang | null>(null);
  const [showIntro, setShowIntro] = useState(true);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [step, setStep] = useState(0);
  const [input, setInput] = useState("");
  const [done, setDone] = useState(false);
  const [copied, setCopied] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<{ label: string; file: File }[]>([]);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [sendError, setSendError] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [serviceMode, setServiceMode] = useState(false);
  const [serviceStep, setServiceStep] = useState<ServiceStep>("name");
  const [serviceCount, setServiceCount] = useState(0);
  const [currentService, setCurrentService] = useState<{ name: string; description: string; price: string }>({ name: "", description: "", price: "" });

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const questions = lang ? QUESTIONS[lang] : QUESTIONS.en;
  const phases = lang ? PHASES[lang] : PHASES.en;
  const ui = lang ? UI[lang] : UI.en;
  const svc = lang ? SVC[lang] : SVC.en;

  const currentQ = questions[step];
  const currentPhase = serviceMode ? 3 : (currentQ?.phase ?? 4);
  const progress = Math.round((step / questions.length) * 100);

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
  }, []);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);
  useEffect(() => { setTimeout(() => inputRef.current?.focus(), 300); }, [step, serviceStep]);

  const startChat = (selectedLang: Lang) => {
    setLang(selectedLang);
    setShowIntro(false);
    const firstQ = QUESTIONS[selectedLang][0];
    setTimeout(() => {
      setMessages([{ role: "assistant", text: typeof firstQ.text === "function" ? firstQ.text({}) : firstQ.text }]);
    }, 400);
  };

  const addMessage = (text: string) => {
    setTimeout(() => setMessages(prev => [...prev, { role: "assistant", text }]), 500);
  };

  const advanceToNextQuestion = (nextStep: number, newAnswers: Record<string, string>) => {
    if (nextStep >= questions.length) {
      setTimeout(() => {
        setMessages(prev => [...prev, { role: "assistant", text: DONE_MSG[lang!] }]);
        setDone(true);
      }, 500);
    } else {
      setTimeout(() => {
        const nextQ = questions[nextStep];
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

    if (serviceMode) {
      const num = serviceCount + 1;
      if (serviceStep === "name") {
        setCurrentService({ name: trimmed, description: "", price: "" });
        setServiceStep("description");
        addMessage(svc.description(trimmed));
      } else if (serviceStep === "description") {
        setCurrentService(prev => ({ ...prev, description: trimmed }));
        setServiceStep("price");
        addMessage(svc.price);
      } else if (serviceStep === "price") {
        const s = { ...currentService, price: trimmed };
        const entry = svc.label(num, s);
        const newList = answers.services_list ? `${answers.services_list}\n\n${entry}` : entry;
        const newAnswers = { ...answers, services_list: newList };
        setAnswers(newAnswers);
        setServiceCount(num);
        setServiceStep("another");
        addMessage(svc.another);
      } else if (serviceStep === "another") {
        const a = trimmed.toLowerCase();
        if (a === "yes" || a === "si" || a === "sí" || a === "y") {
          setServiceStep("name");
          addMessage(svc.next);
        } else {
          setServiceMode(false);
          const idx = questions.findIndex(q => q.key === "services");
          advanceToNextQuestion(idx + 1, answers);
        }
      }
      return;
    }

    const newAnswers = { ...answers, [currentQ.key]: trimmed };
    setAnswers(newAnswers);

    if (currentQ.key === "services") {
      setServiceMode(true);
      setServiceStep("description");
      setServiceCount(0);
      setCurrentService({ name: trimmed, description: "", price: "" });
      addMessage(svc.description(trimmed));
      return;
    }

    advanceToNextQuestion(step + 1, newAnswers);
  };

  const summary = buildSummary(answers);

  const UPLOAD_KEYS = ["logo", "reference_files"];
  const uploadHint = currentQ?.key === "logo" ? ui?.logoHint : ui?.referenceHint;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const label = currentQ?.key === "logo" ? "Logo" : "Reference image";
    const files = Array.from(e.target.files || []).map(file => ({ label, file }));
    setUploadedFiles(prev => [...prev, ...files]);
    e.target.value = "";
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSend = async () => {
    setSending(true);
    setSendError(false);
    const fd = new FormData();
    fd.append("summary", summary);
    fd.append("businessName", answers.business_name || "");
    uploadedFiles.forEach(({ file }) => fd.append("files", file));
    try {
      const res = await fetch("/api/send", { method: "POST", body: fd });
      if (!res.ok) throw new Error();
      setSent(true);
    } catch {
      setSendError(true);
    } finally {
      setSending(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center" style={{ background: "var(--night)" }}>

      {/* Background */}
      <div className="absolute inset-0 z-0">
        <Image src="/background.png" alt="" fill className="object-cover opacity-100" />
        <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse 80% 60% at 50% 40%, rgba(83,74,183,0.18) 0%, transparent 70%)" }} />
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

      {/* Intro screen */}
      <AnimatePresence>
        {showIntro && (
          <motion.div key="intro"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-6"
            style={{ background: "rgba(10,13,31,0.65)", backdropFilter: "blur(4px)" }}>

            <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="rounded-full overflow-hidden"
              style={{ width: 180, height: 180, border: "2px solid rgba(83,74,183,0.5)", boxShadow: "0 0 60px rgba(83,74,183,0.4)" }}>
              <video src="/blu-intro.mp4" autoPlay loop muted playsInline
                style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }} className="text-center">
              <h1 className="text-3xl font-bold mb-2" style={{ color: "var(--snow)" }}>Meet Blu</h1>
              <p className="text-sm" style={{ color: "rgba(175,169,236,0.7)" }}>Market Open Media</p>
            </motion.div>

            {/* Language selector */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="flex flex-col items-center gap-3">
              <p className="text-xs tracking-widest uppercase" style={{ color: "rgba(175,169,236,0.5)" }}>
                Choose your language / Elige tu idioma
              </p>
              <div className="flex gap-3">
                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}
                  onClick={() => startChat("en")}
                  className="px-8 py-3.5 rounded-full font-semibold text-sm"
                  style={{ background: "linear-gradient(135deg, var(--aurora), #6B5CE7)", color: "var(--snow)", boxShadow: "0 0 30px rgba(83,74,183,0.4)" }}>
                  🇺🇸 English
                </motion.button>
                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}
                  onClick={() => startChat("es")}
                  className="px-8 py-3.5 rounded-full font-semibold text-sm"
                  style={{ background: "linear-gradient(135deg, var(--aurora), #6B5CE7)", color: "var(--snow)", boxShadow: "0 0 30px rgba(83,74,183,0.4)" }}>
                  🇪🇸 Español
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat card */}
      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative z-10 flex flex-col w-full mx-4"
        style={{ maxWidth: 480, height: "min(720px, 90vh)", background: "rgba(10,13,31,0.85)", border: "1px solid rgba(83,74,183,0.35)", borderRadius: 24, backdropFilter: "blur(24px)", boxShadow: "0 40px 80px rgba(0,0,0,0.5), 0 0 60px rgba(83,74,183,0.12)", overflow: "hidden" }}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 shrink-0"
          style={{ borderBottom: "1px solid rgba(83,74,183,0.2)" }}>
          <div className="flex items-center gap-3">
            <motion.div className="w-10 h-10 rounded-full overflow-hidden shrink-0"
              style={{ border: "1.5px solid rgba(175,169,236,0.4)", boxShadow: "0 0 20px rgba(83,74,183,0.4)" }}
              animate={{ boxShadow: ["0 0 20px rgba(83,74,183,0.3)", "0 0 35px rgba(83,74,183,0.6)", "0 0 20px rgba(83,74,183,0.3)"] }}
              transition={{ duration: 3, repeat: Infinity }}>
              <Image src="/blu-avatar.png" alt="Blu" width={40} height={40} className="object-cover" />
            </motion.div>
            <div>
              <p className="font-semibold text-sm" style={{ color: "var(--snow)" }}>Blu</p>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: "var(--aurora-teal)" }} />
                <p className="text-xs" style={{ color: "var(--aurora-teal)" }}>{ui.online}</p>
              </div>
            </div>
          </div>
          <div className="flex gap-1.5">
            {phases.map((_, i) => (
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
            <span className="text-xs" style={{ color: "rgba(175,169,236,0.4)" }}>{phases[currentPhase]?.icon} {phases[currentPhase]?.label}</span>
            <span className="text-xs" style={{ color: "rgba(175,169,236,0.4)" }}>{progress}%</span>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-5 pt-8 pb-4 flex flex-col gap-4" style={{ scrollbarWidth: "none" }}>
          <AnimatePresence initial={false}>
            {messages.map((m, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35 }}
                className={`flex items-end gap-2.5 ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                {m.role === "assistant" && (
                  <div className="w-7 h-7 rounded-full overflow-hidden shrink-0 mb-0.5"
                    style={{ border: "1px solid rgba(175,169,236,0.3)" }}>
                    <Image src="/blu-avatar.png" alt="Blu" width={28} height={28} className="object-cover" />
                  </div>
                )}
                <div className="px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-line"
                  style={{ maxWidth: "78%", wordBreak: "break-word", overflowWrap: "break-word", display: "inline-block",
                    ...(m.role === "assistant"
                      ? { background: "rgba(83,74,183,0.14)", color: "var(--snow)", border: "1px solid rgba(83,74,183,0.22)", borderBottomLeftRadius: 4 }
                      : { background: "linear-gradient(135deg, var(--aurora), #6B5CE7)", color: "var(--snow)", borderBottomRightRadius: 4, boxShadow: "0 4px 20px rgba(83,74,183,0.3)" }) }}>
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
              {sent ? (
                <div className="w-full py-3.5 rounded-full font-semibold text-sm text-center"
                  style={{ background: "rgba(93,202,165,0.15)", color: "var(--aurora-teal)", border: "1px solid rgba(93,202,165,0.4)" }}>
                  {ui.sent}
                </div>
              ) : (
                <motion.button onClick={handleSend} disabled={sending} whileHover={{ scale: sending ? 1 : 1.02 }} whileTap={{ scale: 0.97 }}
                  className="w-full py-3.5 rounded-full font-semibold text-sm text-center transition-opacity"
                  style={{ background: "linear-gradient(135deg, var(--aurora), #6B5CE7)", color: "var(--snow)", boxShadow: "0 0 40px rgba(83,74,183,0.45)", opacity: sending ? 0.7 : 1 }}>
                  {sending ? `⏳ ${ui.sending}` : `📨 ${ui.send}`}
                </motion.button>
              )}
              {sendError && (
                <p className="text-xs text-center" style={{ color: "#f87171" }}>{ui.sendError}</p>
              )}
              <button onClick={handleCopy}
                className="w-full py-3.5 rounded-full font-semibold text-sm text-center transition-all"
                style={{ background: "rgba(83,74,183,0.12)", color: copied ? "var(--aurora-teal)" : "var(--aurora-light)", border: `1px solid ${copied ? "rgba(93,202,165,0.4)" : "rgba(83,74,183,0.25)"}` }}>
                {copied ? ui.copied : `📋 ${ui.copy}`}
              </button>
            </motion.div>
          ) : (
            <div className="flex flex-col gap-2">
              {/* File upload for logo and imagery questions */}
              {lang && UPLOAD_KEYS.includes(currentQ?.key) && (
                <div className="flex flex-col gap-1.5">
                  <p className="text-xs px-1" style={{ color: "rgba(175,169,236,0.5)" }}>{uploadHint}</p>
                  <div className="flex flex-wrap gap-1.5 items-center">
                    {uploadedFiles.filter(f => f.label === (currentQ?.key === "logo" ? "Logo" : "Reference image")).map((f) => (
                      <div key={f.file.name} className="flex items-center gap-1 px-2 py-1 rounded-full text-xs"
                        style={{ background: "rgba(83,74,183,0.18)", color: "var(--aurora-light)", border: "1px solid rgba(83,74,183,0.3)", maxWidth: 160, overflow: "hidden" }}>
                        <span className="truncate">{f.file.name}</span>
                        <button onClick={() => removeFile(uploadedFiles.indexOf(f))}
                          className="shrink-0 ml-0.5 opacity-60 hover:opacity-100" style={{ fontSize: 14, lineHeight: 1 }}>×</button>
                      </div>
                    ))}
                    <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-full cursor-pointer text-xs font-medium transition-all hover:opacity-80"
                      style={{ background: "rgba(83,74,183,0.12)", color: "var(--aurora-light)", border: "1px solid rgba(83,74,183,0.25)" }}>
                      <input ref={fileInputRef} type="file" multiple accept="image/*,.pdf,.ai,.svg,.eps,.png,.jpg,.jpeg,.webp" className="hidden"
                        onChange={handleFileChange} />
                      {ui.attachFiles}
                    </label>
                  </div>
                </div>
              )}
              <div className="flex gap-2 items-center"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(83,74,183,0.25)", borderRadius: 99, padding: "6px 6px 6px 18px", backdropFilter: "blur(12px)" }}>
                <input ref={inputRef} value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendAnswer(); } }}
                  placeholder={ui.placeholder}
                  className="flex-1 bg-transparent text-sm outline-none"
                  style={{ color: "var(--snow)" }} />
                <motion.button onClick={sendAnswer} whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.94 }}
                  className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-sm font-bold"
                  style={{ background: input.trim() ? "linear-gradient(135deg, var(--aurora), #6B5CE7)" : "rgba(83,74,183,0.2)", color: "var(--snow)", transition: "background 0.2s", boxShadow: input.trim() ? "0 0 20px rgba(83,74,183,0.4)" : "none" }}>
                  →
                </motion.button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
