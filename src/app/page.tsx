import { Synthesizer } from "../components/Synthesizer";

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-100 to-gray-200 py-4 px-4 sm:px-6 lg:px-8 landscape:py-2">
      <div className="w-full mx-auto  shadow-xl rounded-lg overflow-hidden">
        <div className="px-4 py-5 sm:p-6 landscape:p-4">
          <h1 className="text-3xl font-bold text-gray-900 mb-6 landscape:mb-2 landscape:text-2xl"></h1>
          <Synthesizer />
        </div>
      </div>
    </main>
  );
}
