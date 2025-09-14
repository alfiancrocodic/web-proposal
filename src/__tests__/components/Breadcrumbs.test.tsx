import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import Breadcrumbs from '@/components/Breadcrumbs';

describe('Breadcrumbs Component', () => {
  /**
   * Test untuk render breadcrumbs dengan single item
   */
  it('should render breadcrumbs with single item', () => {
    const crumbs = ['Home'];

    render(<Breadcrumbs crumbs={crumbs} />);

    expect(screen.getByText('Home')).toBeInTheDocument();
  });

  /**
   * Test untuk render breadcrumbs dengan multiple items
   */
  it('should render breadcrumbs with multiple items', () => {
    const crumbs = ['Home', 'Projects', 'Project Detail'];

    render(<Breadcrumbs crumbs={crumbs} />);

    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Projects')).toBeInTheDocument();
    expect(screen.getByText('Project Detail')).toBeInTheDocument();

    // Check if separators (chevron icons) are present
    const chevronIcons = screen.getAllByTestId('chevron-icon');
    expect(chevronIcons).toHaveLength(2); // Should have 2 separators for 3 items
  });

  /**
   * Test untuk render breadcrumbs dengan current page styling
   */
  it('should render current page with different styling', () => {
    const crumbs = ['Home', 'Current Page'];

    render(<Breadcrumbs crumbs={crumbs} />);

    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Current Page')).toBeInTheDocument();

    // Home should have blue color (not current page)
    const homeElement = screen.getByText('Home');
    expect(homeElement).toHaveClass('text-blue-600');

    // Current page should have gray color
    const currentPageElement = screen.getByText('Current Page');
    expect(currentPageElement).toHaveClass('text-gray-500');
  });

  /**
   * Test untuk render breadcrumbs kosong
   */
  it('should render empty breadcrumbs', () => {
    const crumbs: string[] = [];

    render(<Breadcrumbs crumbs={crumbs} />);

    // Should render navigation but no breadcrumb items
    expect(screen.getByRole('navigation')).toBeInTheDocument();
    expect(screen.queryByText('Home')).not.toBeInTheDocument();
  });

  /**
   * Test untuk styling dan accessibility
   */
  it('should have proper accessibility attributes', () => {
    const crumbs = ['Home', 'Projects'];

    render(<Breadcrumbs crumbs={crumbs} />);

    const nav = screen.getByRole('navigation');
    expect(nav).toBeInTheDocument();
    expect(nav).toHaveAttribute('aria-label', 'Breadcrumb');
  });

  /**
   * Test untuk long breadcrumb labels
   */
  it('should handle long breadcrumb labels', () => {
    const crumbs = [
      'Home',
      'Very Long Project Name That Might Overflow',
      'Even Longer Proposal Name That Definitely Will Test The Layout'
    ];

    render(<Breadcrumbs crumbs={crumbs} />);

    expect(screen.getByText('Very Long Project Name That Might Overflow')).toBeInTheDocument();
    expect(screen.getByText('Even Longer Proposal Name That Definitely Will Test The Layout')).toBeInTheDocument();
  });

  /**
   * Test untuk special characters dalam labels
   */
  it('should handle special characters in labels', () => {
    const crumbs = [
      'Home & Dashboard',
      'Project "Test"',
      'Proposal <v1.0>'
    ];

    render(<Breadcrumbs crumbs={crumbs} />);

    expect(screen.getByText('Home & Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Project "Test"')).toBeInTheDocument();
    expect(screen.getByText('Proposal <v1.0>')).toBeInTheDocument();
  });
});