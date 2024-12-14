import React from 'react'
import { createRoot } from 'react-dom/client'
import { createFixtureRenderer } from 'react-cosmos/client'
import Decorator from '../src/cosmos.decorator'

const rootEl = document.getElementById('root')
if (!rootEl) throw new Error('Missing root element')

const root = createRoot(rootEl)
createFixtureRenderer({ root, decorators: [Decorator] })
