import React, { Component, ReactNode } from 'react'

interface Props {
  children: ReactNode
  FallbackComponent: React.ComponentType<{ error: Error }>
}

interface State {
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  render() {
    const { error } = this.state
    const { children, FallbackComponent } = this.props

    if (error) {
      return <FallbackComponent error={error} />
    }

    return children
  }
}
