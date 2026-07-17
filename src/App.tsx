function App() {
  return (
    <div className="min-h-svh bg-white text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <header className="border-b border-slate-200 dark:border-slate-800">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <span className="text-lg font-semibold tracking-tight">
            Resume<span className="text-indigo-600 dark:text-indigo-400">Forge</span>
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-20 text-center">
        <h1 className="text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
          Get recruiter-grade feedback on your resume
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-lg text-pretty text-slate-600 dark:text-slate-400">
          Upload your resume and get an ATS compatibility score, a recruiter
          score, and specific suggestions in seconds. No account needed.
        </p>

        <div className="mt-12 rounded-xl border border-dashed border-slate-300 p-12 dark:border-slate-700">
          <p className="text-sm text-slate-500 dark:text-slate-500">
            Upload coming next.
          </p>
        </div>
      </main>
    </div>
  )
}

export default App
