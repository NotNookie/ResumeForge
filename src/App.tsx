import { useState } from 'react'
import { SiteHeader } from '@/components/SiteHeader'
import { SiteFooter } from '@/components/SiteFooter'
import { UploadView } from '@/views/UploadView'
import { AnalyzingView } from '@/views/AnalyzingView'
import { ResultsView } from '@/views/ResultsView'
import { FailureView } from '@/views/FailureView'
import { NotResumeView } from '@/views/NotResumeView'
import { AnalysisError, NotAResumeError, analyzeResume } from '@/api/analyze'
import { FAILURE_COPY, type ViewState } from '@/lib/view-state'

function App() {
  const [view, setView] = useState<ViewState>({ status: 'idle' })

  async function runAnalysis(file: File, options: { force?: boolean } = {}) {
    setView({ status: 'analyzing', file })
    try {
      const analysis = await analyzeResume(file, options)
      setView({ status: 'results', analysis })
    } catch (error) {
      // The heuristic flagged a non-resume: a warning the user can override.
      if (error instanceof NotAResumeError) {
        setView({ status: 'notResume', file, reason: error.reason })
        return
      }
      // Only AnalysisError carries a failure the UI has a screen for. Anything
      // else is a bug or a network fault, and gets the generic screen rather
      // than a raw message the user can't act on.
      setView({
        status: 'failed',
        failure: error instanceof AnalysisError ? error.failure : 'unknown',
        file,
      })
    }
  }

  return (
    <div className="flex min-h-svh flex-col">
      <SiteHeader />

      {renderView()}

      <SiteFooter />
    </div>
  )

  function renderView() {
    switch (view.status) {
      // One screen: the dropzone and the selected-file card are the same view
      // with and without a file.
      case 'idle':
      case 'fileSelected':
        return (
          <UploadView
            file={view.status === 'fileSelected' ? view.file : null}
            onFileSelected={(file) => setView({ status: 'fileSelected', file })}
            onFileCleared={() => setView({ status: 'idle' })}
            onAnalyze={() => {
              if (view.status === 'fileSelected') void runAnalysis(view.file)
            }}
          />
        )

      case 'analyzing':
        return <AnalyzingView fileName={view.file.name} />

      case 'results':
        return <ResultsView analysis={view.analysis} onReset={() => setView({ status: 'idle' })} />

      case 'notResume':
        return (
          <NotResumeView
            reason={view.reason}
            onAnalyzeAnyway={() => void runAnalysis(view.file, { force: true })}
            onChooseAnother={() => setView({ status: 'idle' })}
          />
        )

      case 'failed':
        return (
          <FailureView
            failure={view.failure}
            onRetry={() =>
              FAILURE_COPY[view.failure].canRetrySameFile
                ? void runAnalysis(view.file)
                : setView({ status: 'idle' })
            }
            onStartOver={() => setView({ status: 'idle' })}
          />
        )
    }
  }
}

export default App
