import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { QuickLookSheet } from '../components/QuickLookSheet';

describe('QuickLookSheet Component', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    onOpenFullStudy: vi.fn(),
    verseReference: 'João 3:16',
    commentaries: [
      {
        author: 'Matthew Henry',
        era: '1706',
        work: 'Exposition of the Old and New Testaments',
        year: '1706',
        text: 'Deus tanto amou o mundo que deu o seu Filho Unigênito...',
        source_url: null,
      },
      {
        author: 'Albert Barnes',
        era: '1832',
        work: 'Notes on the Bible',
        year: '1832',
        text: 'A grandeza do amor de Deus demonstrada na dádiva suprema...',
        source_url: null,
      },
    ],
    isLoading: false,
  };

  it('should not render anything when isOpen is false', () => {
    const { container } = render(<QuickLookSheet {...defaultProps} isOpen={false} />);
    expect(container.querySelector('[role="dialog"]')).toBeNull();
  });

  it('should render verse reference, author title and commentary text when open', () => {
    render(<QuickLookSheet {...defaultProps} />);
    expect(screen.getByText('João 3:16')).toBeDefined();
    expect(screen.getByText('Matthew Henry')).toBeDefined();
    expect(screen.getByText(/Deus tanto amou o mundo/)).toBeDefined();
  });

  it('should allow navigating between commentaries', () => {
    render(<QuickLookSheet {...defaultProps} />);
    expect(screen.getByText('Matthew Henry')).toBeDefined();

    const nextButton = screen.getByLabelText('Próximo comentário');
    fireEvent.click(nextButton);

    expect(screen.getByText('Albert Barnes')).toBeDefined();
    expect(screen.getByText(/A grandeza do amor de Deus/)).toBeDefined();
  });

  it('should call onOpenFullStudy when clicking Abrir Estudo Completo', () => {
    render(<QuickLookSheet {...defaultProps} />);
    const fullStudyButton = screen.getByText('Abrir Estudo Completo');
    fireEvent.click(fullStudyButton);

    expect(defaultProps.onClose).toHaveBeenCalled();
    expect(defaultProps.onOpenFullStudy).toHaveBeenCalled();
  });
});
