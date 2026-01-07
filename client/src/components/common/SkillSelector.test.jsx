import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import SkillSelector from './SkillSelector';

describe('SkillSelector Component', () => {
  const mockOnSkillsChange = vi.fn();
  const defaultProps = {
    selectedSkills: [],
    onSkillsChange: mockOnSkillsChange,
    title: 'Test Skills'
  };

  beforeEach(() => {
    mockOnSkillsChange.mockClear();
  });

  test('renders title and empty state', () => {
    render(<SkillSelector {...defaultProps} />);
    expect(screen.getByText('Test Skills (0/20)')).toBeInTheDocument();
    expect(screen.getByText('No skills selected yet.')).toBeInTheDocument();
  });

  test('renders selected skills chips', () => {
    render(<SkillSelector {...defaultProps} selectedSkills={['JavaScript', 'Python']} />);
    expect(screen.getByText('JavaScript')).toBeInTheDocument();
    expect(screen.getByText('Python')).toBeInTheDocument();
    expect(screen.queryByText('No skills selected yet.')).not.toBeInTheDocument();
  });

  test('shows predefined skills when "Show Suggestions" is clicked', () => {
    render(<SkillSelector {...defaultProps} />);

    // Initially hidden
    expect(screen.queryByText('JavaScript')).not.toBeInTheDocument();

    // Click to show
    fireEvent.click(screen.getByText('Show Suggestions'));

    // Check if skills are visible
    expect(screen.getByText('JavaScript')).toBeInTheDocument();
    expect(screen.getByText('React')).toBeInTheDocument();
  });

  test('calls onSkillsChange when a predefined skill is clicked', () => {
    render(<SkillSelector {...defaultProps} />);
    fireEvent.click(screen.getByText('Show Suggestions'));

    fireEvent.click(screen.getByText('JavaScript'));
    expect(mockOnSkillsChange).toHaveBeenCalledWith(['JavaScript']);
  });

  test('calls onSkillsChange when removing a skill', () => {
    render(<SkillSelector {...defaultProps} selectedSkills={['JavaScript']} />);

    // Find remove button (the '×' inside the chip)
    const removeBtn = screen.getByLabelText('Remove JavaScript');
    fireEvent.click(removeBtn);

    expect(mockOnSkillsChange).toHaveBeenCalledWith([]);
  });

  test('adds custom skill via input', () => {
    render(<SkillSelector {...defaultProps} />);

    const input = screen.getByPlaceholderText('Add other skill...');
    const addBtn = screen.getByText('Add');

    fireEvent.change(input, { target: { value: 'My Custom Skill' } });
    fireEvent.click(addBtn);

    expect(mockOnSkillsChange).toHaveBeenCalledWith(['My Custom Skill']);
  });

  test('prevents adding empty custom skill', () => {
    render(<SkillSelector {...defaultProps} />);

    const addBtn = screen.getByText('Add');
    fireEvent.click(addBtn);

    expect(mockOnSkillsChange).not.toHaveBeenCalled();
  });

  test('prevents adding duplicate custom skill', () => {
    render(<SkillSelector {...defaultProps} selectedSkills={['JavaScript']} />);

    const input = screen.getByPlaceholderText('Add other skill...');
    const addBtn = screen.getByText('Add');

    fireEvent.change(input, { target: { value: 'javascript' } }); // Case insensitive check
    fireEvent.click(addBtn);

    expect(mockOnSkillsChange).not.toHaveBeenCalled();
    expect(screen.getByText('Skill already added.')).toBeInTheDocument();
  });

  test('respects max skills limit (20)', () => {
    // Create an array of 20 skills
    const maxSkills = Array.from({ length: 20 }, (_, i) => `Skill ${i}`);
    render(<SkillSelector {...defaultProps} selectedSkills={maxSkills} />);

    const input = screen.getByPlaceholderText('Add other skill...');
    const addBtn = screen.getByText('Add');

    fireEvent.change(input, { target: { value: 'New Skill' } });
    fireEvent.click(addBtn);

    expect(mockOnSkillsChange).not.toHaveBeenCalled();
    expect(screen.getByText('Maximum 20 skills allowed.')).toBeInTheDocument();
  });
});
