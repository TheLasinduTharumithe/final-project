import ChatBox from "@/components/ChatBox";

export default function ChatPage() {
  return (
    <section className="page-shell">
      <div className="mb-8 max-w-3xl">
        <p className="text-sm uppercase tracking-[0.3em] text-[#2E7D32]">EcoPlate Assistant</p>
        <h1 className="mt-3 text-4xl font-semibold text-[#1F2937]">
          Sinhala හෝ English වලින් EcoPlate data සහ guidance අහන්න
        </h1>
        <p className="mt-4 text-[#6B7280]">
          මේ assistant එකට ඔබේ real donations, requests, ads, profile data ගැනත් food safety,
          packing, pickup guidance ගැනත් Sinhala-friendly විදිහට අහන්න පුළුවන්.
        </p>
      </div>

      <ChatBox />
    </section>
  );
}
