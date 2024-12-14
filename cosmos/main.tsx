import React from 'react'
import { createRoot } from 'react-dom/client'
import { createRendererConnect } from 'react-cosmos/renderer'
import { decorators } from '../src/cosmos.decorator'

const rootEl = document.getElementById('root')
if (!rootEl) throw new Error('Missing root element')

const root = createRoot(rootEl)
createRendererConnect({ decorators })({ root })
