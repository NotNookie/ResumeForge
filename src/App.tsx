import { useState } from 'react'
import { SiteHeader } from '@/components/SiteHeader'
import { SiteFooter } from '@/components/SiteFooter'
import { UploadView } from '@/views/UploadView'
import { AnalyzingView } from '@/views/AnalyzingView'
import { ResultsView } from '@/views/ResultsView'
import { FailureView } from '@/views/FailureView'
import { AnalysisError, analyzeResume } from '@/api/analyze'
import { FAILURE_COPY, type ViewState } from '@/lib/view-state'
import { PreviewBar } from '@/dev/PreviewBar'
import { presetFromUrl } from '@/dev/presets'

function App() {
  const [view, setView] = useState<ViewState>(() => presetFromUrl() ?? { status: 'idle' })

  async function runAnalysis(file: File) {
    setView({ status: 'analyzing', file })
    try {
      const analysis = await analyzeResume(file)
      setView({ status: 'results', analysis })
    } catch (error) {
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
      <PreviewBar onSelect={setView} />

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
