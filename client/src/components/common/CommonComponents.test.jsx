import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Button, Input, Card } from './index';

describe('Common UI Components', () => {
  describe('Button', () => {
    it('renders with default variant', () => {
      render(<Button>Click Me</Button>);
      const btn = screen.getByRole('button', { name: /click me/i });
      expect(btn).toHaveClass('btn');
      expect(btn).toHaveClass('btn-primary');
    });

    it('renders with specified variant', () => {
      render(<Button variant="secondary">Secondary</Button>);
      const btn = screen.getByRole('button', { name: /secondary/i });
      expect(btn).toHaveClass('btn-secondary');
    });

    it('handles click events', () => {
      const handleClick = vi.fn();
      render(<Button onClick={handleClick}>Click</Button>);
      fireEvent.click(screen.getByText('Click'));
      expect(handleClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('Input', () => {
    it('renders input element', () => {
      render(<Input placeholder="Enter text" />);
      const input = screen.getByPlaceholderText('Enter text');
      expect(input).toBeInTheDocument();
      expect(input).toHaveClass('input');
    });
  });

  describe('Card', () => {
    it('renders children', () => {
      render(<Card>Card Content</Card>);
      expect(screen.getByText('Card Content')).toBeInTheDocument();
      expect(screen.getByText('Card Content').closest('.card')).toBeInTheDocument();
    });

    it('renders title when provided', () => {
      render(<Card title="Card Title">Content</Card>);
      expect(screen.getByText('Card Title')).toBeInTheDocument();
      expect(screen.getByText('Card Title')).toHaveClass('card-title');
    });
  });
});