/**
 * Pay — single entry for payments.
 * One main view (Micropayments). Agents = receipts/caps page. Chat pay opens global agent.
 */

import { lazy, Suspense, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { useAgentPanelStore } from '../store/agentPanelStore'

const Micropayments = lazy(() => import('./Micropayments'))
const AgentEconomy = lazy(() => import('./AgentEconomy'))
const CARV = lazy(() => import('./CARV'))

function PageLoader() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-cyber-glow/30 border-t-cyber-glow" />
    </div>
  )
}

function PayBackLink() {
  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 pt-20">
      <Link
        to="/pay"
        className="inline-flex items-center gap-2 text-sm text-cyber-muted hover:text-cyber-glow"
      >
        <ArrowLeft size={16} />
        Back to Pay
      </Link>
    </div>
  )
}

export default function PayPage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Micropayments />
    </Suspense>
  )
}

export function PayAgentsPage() {
  return (
    <>
      <PayBackLink />
      <Suspense fallback={<PageLoader />}>
        <AgentEconomy />
      </Suspense>
    </>
  )
}

/** /pay/carv: open the global agent (same as “Chat pay”) and go to Pay. */
export function PayCARVRedirect() {
  const navigate = useNavigate()
  const setAgentOpen = useAgentPanelStore((s) => s.setOpen)

  useEffect(() => {
    setAgentOpen(true, 'chat')
    navigate('/pay', { replace: true })
  }, [navigate, setAgentOpen])

  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-cyber-glow/30 border-t-cyber-glow" />
    </div>
  )
}

/** /pay/agents: open global agent to Economy tab and go to Pay. */
export function PayAgentsRedirect() {
  const navigate = useNavigate()
  const setAgentOpen = useAgentPanelStore((s) => s.setOpen)

  useEffect(() => {
    setAgentOpen(true, 'economy')
    navigate('/pay', { replace: true })
  }, [navigate, setAgentOpen])

  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-cyber-glow/30 border-t-cyber-glow" />
    </div>
  )
}

/** Standalone CARV page (kept for direct link if needed). */
export function PayCARVPage() {
  return (
    <>
      <PayBackLink />
      <Suspense fallback={<PageLoader />}>
        <CARV />
      </Suspense>
    </>
  )
}
