import React from 'react'

const TestComponent = () => {
  console.log('Test Component: Rendering')
  return <div>Test Component</div>
}

export default {
  'Simple Test': () => {
    console.log('Test Fixture: Rendering')
    return <TestComponent />
  }
}
