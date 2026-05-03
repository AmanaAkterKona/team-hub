"use client";
import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import img4 from "../public/img4.png";
import img3 from "../public/img3.png";
import img2 from "../public/img2.png";
import cta1 from "../public/cta1.jpg";
import cta2 from "../public/cta2.jpg";
import cta3 from "../public/cta3.jpg";
import cta4 from "../public/cta4.jpg";

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);
  const [activeStep, setActiveStep] = useState(0);

  const steps = [
    {
      id: 0,
      tag: "Step 01",
      title: "Create Workspace",
      desc: "Sign up and create a workspace for your team in seconds. Customize with your brand color.",
      image: img2,
    },
    {
      id: 1,
      tag: "Step 02",
      title: "Invite Your Team",
      desc: "Send email invitations to teammates. Assign Admin or Member roles with granular permissions.",
      image: img3,
    },
    {
      id: 2,
      tag: "Step 03",
      title: "Track Progress",
      desc: "Create goals with milestones, assign action items on the Kanban board, and post announcements.",
      image: img4,
    },
    {
      id: 3,
      tag: "Step 04",
      title: "Collaborate in real time",
      desc: "See live updates, react to posts, mention teammates, and watch progress happen together.",
      image: img2, // Step 4 er jonno available image use kora hoyeche
    },
  ];

  // Auto slide functionality
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveStep((prev) => (prev === steps.length - 1 ? 0 : prev + 1));
    }, 5000);
    return () => clearInterval(timer);
  }, [steps.length]);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const features = [
    { title: "Goals & Milestones", icon: "📊", desc: "Set team goals, track milestones, and celebrate progress with visual dashboards." },
    { title: "Kanban Board", icon: "📋", desc: "Organize action items with drag-and-drop Kanban. Switch to list view anytime." },
    { title: "Real-time Updates", icon: "🔔", desc: "Socket.io powers live notifications, reactions, and status changes instantly." },
    { title: "Announcements", icon: "📢", desc: "Admins post rich announcements. Team reacts with emojis and @mentions." },
    { title: "Team Workspaces", icon: "👥", desc: "Create multiple workspaces, invite members, and assign Admin roles." },
    { title: "Analytics", icon: "📈", desc: "Dashboard stats, goal completion charts, and one-click CSV export." },
  ];

  return (
    <div className="min-h-screen bg-[#080B14] text-white overflow-x-hidden font-sans">
      <style jsx>{`
        @keyframes scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(calc(-400px * 3 - 2rem * 3)); } 
        }
        .carousel-track {
          display: flex;
          width: max-content;
          animation: scroll 40s linear infinite;
        }
        .carousel-track:hover {
          animation-play-state: paused;
        }
      `}</style>

     {/* Navbar */}
<nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? "bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm" : "bg-white"}`}>
  <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
    
    {/* PREMIUM LOGO WRAPPED WITH LINK TO HOME */}
    <Link href="/" className="flex items-center gap-3 group cursor-pointer">
      <div className="relative">
        {/* Geometric Icon style same as footer */}
        <div className="w-9 h-9 bg-[#254283] rounded-xl flex items-center justify-center rotate-3 group-hover:rotate-0 transition-all duration-300 shadow-lg shadow-blue-900/10">
          <div className="w-4 h-4 border-2 border-white/40 rounded-md rotate-45 flex items-center justify-center">
            <div className="w-1 h-1 bg-white rounded-full shadow-[0_0_8px_rgba(255,255,255,1)]" />
          </div>
        </div>
      </div>

      <div className="flex flex-col">
        <span className="text-xl font-black text-[#1a1a1a] tracking-tighter leading-none">
          TEAM<span className="text-[#254283]">HUB</span>
        </span>
        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-[0.2em] mt-0.5">
          Workspace
        </span>
      </div>
    </Link>

    <div className="hidden md:flex gap-8 text-sm font-medium text-gray-600">
      <Link href="#features" className="hover:text-[#254283] transition-colors">Features</Link>
      <Link href="#how-it-works" className="hover:text-[#254283] transition-colors">How it works</Link>
    </div>

    <div className="flex items-center gap-3">
  <Link href="/dashboard" className="px-6 py-2.5 text-[#254283] text-sm font-semibold hover:bg-[#254283]/5 rounded-full transition-all">
    Dashboard →
  </Link>
  <Link href="/auth/register" className="px-6 py-2.5 bg-[#254283] text-white rounded-full text-sm font-medium hover:bg-[#1e3569] transition-all shadow-md shadow-blue-900/10">
    Get started
  </Link>
</div>

  </div>
</nav>

     {/* Hero Section */}
      <section className="relative pt-40 pb-28 px-6 min-h-[90vh] flex items-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img src={img4.src} alt="Hero Background" className="w-full h-full object-cover object-center opacity-30" />
          <div className="absolute inset-0 bg-gradient-to-b from-[#080B14]/80 via-[#080B14]/60 to-[#080B14]" />
        </div>
        <div className="max-w-5xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#254283]/15 border border-[#254283]/20 rounded-full text-[#254283] text-sm font-semibold mb-10">
            <div className="w-2.5 h-2.5 bg-[#254283] rounded-full animate-pulse shadow shadow-blue-900/50" />
            Real-time collaboration platform
          </div>
          <h1 className="text-6xl md:text-8xl font-extrabold leading-[1.1] mb-8 tracking-tighter text-white">Your team's <span className="block bg-gradient-to-r from-blue-100 via-blue-200 to-[#254283] bg-clip-text text-transparent">command center</span></h1>
          <p className="text-lg md:text-2xl text-gray-300 max-w-3xl mx-auto mb-14 leading-relaxed font-medium">Manage goals, track progress, share announcements, and collaborate in real time — all in one beautiful workspace built for modern teams.</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-5 mb-20">
            <Link href="/auth/register" className="w-full sm:w-auto px-10 py-5 bg-[#254283] hover:bg-[#1e3569] text-white rounded-full font-bold text-xl transition-all shadow-xl shadow-blue-900/30 hover:-translate-y-1">Start for free →</Link>
            <Link href="/auth/login" className="w-full sm:w-auto px-10 py-5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full font-semibold text-lg text-white transition-all backdrop-blur-sm">Sign in to your account</Link>
          </div>
        </div>
      </section>

      {/* FEATURES SECTION */}
      <section id="features" className="py-32 bg-[#FDFBF7] text-[#1a1a1a]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-end mb-20 gap-8">
            <div className="max-w-2xl">
              <div className="flex items-center gap-2 text-[#254283] font-bold text-xs uppercase tracking-widest mb-4">
                <span className="w-5 h-5 rounded-full border border-[#254283] flex items-center justify-center">+</span>
                Core Capabilities
              </div>
              <h2 className="text-5xl md:text-7xl font-bold leading-tight tracking-tight text-[#1a1a1a]">
                Efficiency Driven By <br/> Smart Tools
              </h2>
            </div>
            <div className="md:w-1/3">
               <p className="text-gray-500 text-lg mb-8 leading-relaxed">
                 Everything you need to manage your workspace. From tracking milestones to real-time team synchronization.
               </p>
               <button className="px-8 py-3.5 bg-[#254283] text-white rounded-full font-bold hover:bg-[#1a3569] transition-all">Explore All Features</button>
            </div>
          </div>

          <div className="relative overflow-hidden cursor-grab active:cursor-grabbing">
            <div className="carousel-track flex gap-8">
              {[...features, ...features].map((feature, idx) => (
                <div key={idx} className="w-[400px] flex-shrink-0 bg-white rounded-[2.5rem] p-12 border border-gray-100 shadow-sm flex flex-col items-center text-center hover:shadow-lg transition-shadow duration-500">
                  <div className="text-[#254283]/10 mb-8">
                    <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M14.017 21L14.017 18C14.017 16.8954 14.9124 16 16.017 16H19.017C19.5693 16 20.017 15.5523 20.017 15V9C20.017 8.44772 19.5693 8 19.017 8H15.017C14.4647 8 14.017 8.44772 14.017 9V12M3.017 21L3.017 18C3.017 16.8954 3.91243 16 5.017 16H8.017C8.56928 16 9.017 15.5523 9.017 15V9C9.017 8.44772 8.56928 8 8.017 8H4.017C3.46472 8 3.017 8.44772 3.017 9V12" />
                    </svg>
                  </div>
                  <p className="text-gray-500 text-lg leading-relaxed mb-12 min-h-[100px]">{feature.desc}</p>
                  <div className="mt-auto flex flex-col items-center">
                    <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center text-2xl mb-4 border border-gray-100 shadow-inner group-hover:bg-white transition-colors">{feature.icon}</div>
                    <h3 className="text-xl font-bold text-[#1a1a1a] uppercase tracking-tight">{feature.title}</h3>
                    <p className="text-[#254283] text-xs font-bold tracking-widest mt-1 opacity-70">ACTIVE MODULE</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

{/* PREMIUM HOW IT WORKS SECTION - IMAGE WIDTH INCREASED */}
<section id="how-it-works" className="py-32 bg-[#FDFBF7] overflow-hidden">
  <div className="max-w-7xl mx-auto px-6">
    
    {/* Upper Section: Title and Description */}
    <div className="max-w-2xl mb-16">
      <div className="flex items-center gap-2 text-[#254283] font-bold text-xs uppercase tracking-[0.2em] mb-6">
        <span className="w-5 h-5 rounded-full border border-[#254283] flex items-center justify-center text-[10px]">+</span>
        The Workflow
      </div>
      <h2 className="text-5xl md:text-6xl font-bold text-[#1a1a1a] leading-tight mb-8">Purpose Behind <br/> Every Move</h2>
      <p className="text-gray-500 text-lg max-w-md leading-relaxed">Experience a streamlined workflow designed for high-performing teams to stay aligned and efficient.</p>
    </div>

    {/* Lower Section: Grid Ratio Changed for Wider Image */}
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-stretch">
      
      {/* Steps Content (Left) - Occupies 5 Columns */}
      <div className="order-2 lg:order-1 lg:col-span-5 space-y-4">
        {steps.map((step, index) => (
          <div
            key={step.id}
            onClick={() => setActiveStep(index)}
            className={`cursor-pointer p-8 rounded-3xl transition-all duration-500 border ${
              activeStep === index 
              ? "bg-[#254283] border-[#254283] shadow-2xl shadow-blue-900/20 translate-x-4" 
              : "bg-[#F9F6F0] border-transparent hover:border-gray-200"
            }`}
          >
            <h3 className={`text-xl font-bold mb-2 transition-colors duration-500 ${activeStep === index ? "text-white" : "text-[#1a1a1a]"}`}>{step.title}</h3>
            <p className={`text-sm leading-relaxed transition-colors duration-500 ${activeStep === index ? "text-blue-100" : "text-gray-500"}`}>{step.desc}</p>
            <div className={`mt-4 flex items-center gap-2 text-xs font-bold uppercase tracking-wider ${activeStep === index ? "text-white" : "text-[#254283]"}`}>Learn More <span>→</span></div>
          </div>
        ))}
      </div>

      {/* Image Slider (Right) - Occupies 7 Columns (Wider) */}
      <div className="order-1 lg:order-2 lg:col-span-7 flex flex-col">
        <div className="relative w-full h-full overflow-hidden rounded-[3rem] shadow-2xl bg-white">
          {steps.map((step, index) => (
            <div
              key={step.id}
              className={`absolute inset-0 transition-all duration-1000 ease-in-out transform ${
                activeStep === index ? "opacity-100 scale-100 rotate-0" : "opacity-0 scale-105 rotate-1"
              }`}
            >
              <Image 
                src={step.image} 
                alt={step.title} 
                fill 
                className="object-cover" 
                priority 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
            </div>
          ))}
        </div>
        
        {/* Navigation Dots */}
        <div className="mt-8 flex justify-center gap-3">
          {steps.map((_, index) => (
            <button 
              key={index} 
              onClick={() => setActiveStep(index)} 
              className={`h-1.5 transition-all duration-500 rounded-full ${activeStep === index ? "w-12 bg-[#254283]" : "w-3 bg-gray-300"}`} 
            />
          ))}
        </div>
      </div>

    </div>
  </div>
</section>

{/* PREMIUM CTA SECTION - LIGHT THEME WITH PROJECT INFO */}
<section className="py-32 px-6 bg-[#FFFFFF] relative overflow-hidden">
  {/* Subtle Background Accent */}
  <div className="absolute top-0 right-0 w-1/3 h-full bg-[#FDFBF7]/40 pointer-events-none" />
  
  <div className="max-w-7xl mx-auto relative z-10">
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
      
      {/* Left Side: Professional 4-Grid Image Layout (image_958601.jpg style) */}
      <div className="grid grid-cols-2 gap-4">
        <div className="relative h-60 md:h-72 rounded-2xl overflow-hidden shadow-sm group">
          <Image src={cta1} alt="Real-time Workspace" fill className="object-cover transition-transform duration-700 group-hover:scale-105" />
        </div>
        <div className="relative h-60 md:h-72 rounded-2xl overflow-hidden shadow-sm group">
          <Image src={cta2} alt="Team Sync" fill className="object-cover transition-transform duration-700 group-hover:scale-105" />
        </div>
        <div className="relative h-60 md:h-72 rounded-2xl overflow-hidden shadow-sm group">
          <Image src={cta3} alt="Goal Tracking" fill className="object-cover transition-transform duration-700 group-hover:scale-105" />
        </div>
        <div className="relative h-60 md:h-72 rounded-2xl overflow-hidden shadow-sm group">
          <Image src={cta4} alt="Project Delivery" fill className="object-cover transition-transform duration-700 group-hover:scale-105" />
        </div>
      </div>

      {/* Right Side: Original CTA Functionality with Project Info */}
      <div className="text-left lg:pl-8">
        <div className="flex items-center gap-3 text-[#254283] font-bold text-xs uppercase tracking-[0.2em] mb-6">
          <div className="w-5 h-5 rounded-full border border-[#254283] flex items-center justify-center text-[10px] font-black">+</div>
          Built with Next.js & Socket.io
        </div>
        
        <h2 className="text-5xl md:text-6xl font-bold leading-[1.1] mb-8 text-[#1a1a1a] tracking-tight">
          Ready to unite <br /> 
          <span className="text-[#254283]">your team?</span>
        </h2>
        
        <p className="text-gray-500 text-lg mb-10 max-w-lg leading-relaxed">
          Experience the power of Team-Hub. Manage workspaces, track milestones on Kanban boards, and sync your team with real-time announcements — all in one unified platform.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-6">
          {/* Functional Link from your original code */}
          <Link href="/auth/register" className="w-full sm:w-auto px-10 py-4 bg-[#254283] hover:bg-[#1a3569] text-white rounded-full font-bold text-lg transition-all shadow-lg shadow-blue-900/10 hover:shadow-xl flex items-center justify-center gap-2">
            Get started for free
            <span>→</span>
          </Link>
          
          {/* Social Proof / Team Info */}
         <div className="flex items-center gap-3">
  <div className="flex -space-x-3"> {/* Overlap aro clear korar jonno space komano holo */}
    {[img2, img3, img4].map((memberImg, index) => (
      <div 
        key={index} 
        className="relative w-10 h-10 rounded-full border-2 border-white bg-gray-200 overflow-hidden ring-1 ring-gray-100 shadow-sm"
      >
        <Image 
          src={memberImg} 
          alt={`Team Member ${index + 1}`} 
          fill 
          className="object-cover"
          sizes="40px"
        />
      </div>
    ))}
  </div>
  <p className="text-sm font-semibold text-gray-400">
    Join <span className="text-[#1a1a1a]">CodeCatalysts</span>
  </p>
</div>
        </div>
      </div>

    </div>
  </div>
</section>
    {/* Footer - Dark Premium Theme */}
<footer className="border-t border-white/5 py-16 px-6 bg-[#080B14]">
  <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
    
    {/* PREMIUM LOGO SECTION */}
    <div className="flex items-center gap-3 group cursor-pointer">
      <div className="relative">
        {/* Geometric Icon Style (Dark Theme Optimized) */}
        <div className="w-10 h-10 bg-[#254283] rounded-xl flex items-center justify-center rotate-3 group-hover:rotate-0 transition-all duration-300 shadow-lg shadow-blue-900/20">
          <div className="w-5 h-5 border-2 border-white/40 rounded-md rotate-45 flex items-center justify-center">
            <div className="w-1.5 h-1.5 bg-white rounded-full shadow-[0_0_10px_rgba(255,255,255,1)]" />
          </div>
        </div>
        {/* Subtle Blue Glow Effect */}
        <div className="absolute inset-0 bg-[#254283]/40 blur-xl rounded-full -z-10 opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>

      <div className="flex flex-col">
        <span className="text-xl font-black text-white tracking-tighter leading-none">
          TEAM<span className="text-blue-500">HUB</span>
        </span>
        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.3em] mt-1">
          Collaboration
        </span>
      </div>
    </div>

    {/* Copyright Text */}
    <p className="text-gray-500 text-sm font-medium">
      © 2026 TeamHub. Built for modern teams by <span className="text-white font-semibold">CodeCatalysts</span>.
    </p>

    {/* Links */}
    <div className="flex items-center gap-8">
      <Link href="/auth/login" className="text-sm font-bold text-gray-400 hover:text-white transition-colors relative group">
        Sign in
        <span className="absolute -bottom-1 left-0 w-0 h-[1.5px] bg-blue-500 transition-all group-hover:w-full" />
      </Link>
      <Link href="/auth/register" className="px-6 py-2.5 bg-white/5 text-white border border-white/10 rounded-full text-sm font-bold hover:bg-[#254283] hover:border-[#254283] transition-all">
        Get started
      </Link>
    </div>
    
  </div>
</footer>
    </div>
  );
}