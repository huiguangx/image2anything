import { render, screen } from '@testing-library/react'
import { expect, test } from 'vitest'
import App from './App'

test('renders heading', () => {
  render(<App />)
  expect(screen.getByText('Gpt Image 2.0')).toBeDefined()
})

test('renders showcase section', () => {
  render(<App />)
  expect(screen.getByText('效果展示')).toBeDefined()
})

test('renders create section', () => {
  render(<App />)
  expect(screen.getByText('实现梦想')).toBeDefined()
})
