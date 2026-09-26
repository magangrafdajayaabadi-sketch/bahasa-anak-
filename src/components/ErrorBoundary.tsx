import { Component, type ErrorInfo, type ReactNode } from 'react'
import { Button, TutorBubble } from './ui'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ui]', error, info.componentStack)
  }

  render() {
    if (!this.state.hasError) return this.props.children

    return (
      <div className="app">
        <div className="card center stack mt-6">
          <TutorBubble
            mood="think"
            text="Kiko tersandung sebentar. Yuk muat ulang aplikasinya."
          />
          <Button variant="mint" size="lg" onClick={() => window.location.reload()}>
            Muat ulang
          </Button>
        </div>
      </div>
    )
  }
}
