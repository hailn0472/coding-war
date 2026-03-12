# Task 2.3: Modal & Dialog System

## Mục tiêu

Tạo hệ thống modal và dialog components tái sử dụng cho toàn bộ ứng dụng DMOJ React.

## Thời gian ước tính

**2 ngày**

## Dependencies

- Task 1.4: Theme System & Styling Foundation
- Task 2.1: Form Components (cho form modals)

## Technical Requirements

### Core Modal Component

```typescript
interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    size?: "sm" | "md" | "lg" | "xl" | "full";
    closeOnBackdrop?: boolean;
    closeOnEscape?: boolean;
    showCloseButton?: boolean;
    children: React.ReactNode;
}
```

### Dialog Variants

- **ConfirmDialog**: Yes/No confirmations
- **AlertDialog**: Information alerts
- **FormModal**: Modal với form content
- **ImageModal**: Hiển thị images full-screen
- **CodeModal**: Hiển thị code với syntax highlighting

## Implementation Details

### 1. Base Modal Component

**File**: `src/components/ui/Modal/Modal.tsx`

- Portal rendering để tránh z-index issues
- Focus trap để accessibility
- Backdrop click handling
- Escape key handling
- Smooth animations với Framer Motion
- Responsive sizing

### 2. Modal Context & Provider

**File**: `src/components/ui/Modal/ModalProvider.tsx`

- Global modal state management
- Queue system cho multiple modals
- Programmatic modal opening/closing

### 3. Confirmation Dialog

**File**: `src/components/ui/Modal/ConfirmDialog.tsx`

- Customizable confirm/cancel buttons
- Icon support (warning, info, error)
- Promise-based API cho easy usage

### 4. Toast Notification System

**File**: `src/components/ui/Toast/Toast.tsx`

- Success, error, warning, info variants
- Auto-dismiss với configurable timeout
- Stack management cho multiple toasts
- Position options (top-right, bottom-left, etc.)

## DMOJ-Specific Use Cases

### Contest Join Confirmation

```typescript
const handleJoinContest = async () => {
    const confirmed = await showConfirmDialog({
        title: "Join Contest",
        message: "Are you sure you want to join? Joining starts your timer.",
        confirmText: "Join Contest",
        variant: "warning",
    });

    if (confirmed) {
        // Join contest logic
    }
};
```

### Problem Submission Modal

- Code editor trong modal
- Language selection
- Submit button với loading state
- Error handling display

### User Profile Edit Modal

- Form fields cho user information
- Avatar upload
- Validation feedback
- Save/cancel actions

## Styling Requirements

### Modal Backdrop

- Semi-transparent overlay
- Blur effect cho background
- Smooth fade in/out animation

### Modal Container

- Centered positioning
- Responsive width/height
- Drop shadow và border radius
- Theme-aware colors

### Animation System

- Slide up animation cho mobile
- Fade + scale cho desktop
- Stagger animation cho multiple elements
- Exit animations

## Accessibility Features

### Keyboard Navigation

- Tab trapping trong modal
- Escape key để close
- Enter key cho default action
- Arrow keys cho navigation

### Screen Reader Support

- Proper ARIA labels
- Role attributes
- Live regions cho dynamic content
- Focus management

## Testing Strategy

### Unit Tests

- Modal open/close functionality
- Keyboard event handling
- Props validation
- Animation completion

### Integration Tests

- Modal với form submission
- Multiple modal stacking
- Context provider functionality
- Toast notification flow

### E2E Tests

- Contest join confirmation flow
- Problem submission modal
- User settings modal
- Error handling scenarios

## Performance Considerations

### Lazy Loading

- Modal content lazy loading
- Dynamic imports cho heavy components
- Image lazy loading trong modals

### Memory Management

- Proper cleanup on unmount
- Event listener removal
- Animation cleanup

## Migration Notes

### Django Template Equivalents

- Replace Django form modals
- Convert confirmation dialogs
- Migrate alert messages to toasts
- Update error handling displays

### Existing JavaScript

- Replace jQuery modal plugins
- Convert custom dialog implementations
- Update event handling patterns

## Deliverables

### Components

- [ ] Base Modal component
- [ ] ConfirmDialog component
- [ ] AlertDialog component
- [ ] FormModal component
- [ ] Toast notification system
- [ ] Modal context provider

### Hooks

- [ ] useModal hook
- [ ] useConfirmDialog hook
- [ ] useToast hook
- [ ] useModalStack hook

### Documentation

- [ ] Component API documentation
- [ ] Usage examples
- [ ] Migration guide
- [ ] Accessibility guidelines

### Tests

- [ ] Unit tests (90%+ coverage)
- [ ] Integration tests
- [ ] E2E test scenarios
- [ ] Performance benchmarks

## Success Criteria

### Functionality

- ✅ All modal variants working correctly
- ✅ Smooth animations on all devices
- ✅ Proper focus management
- ✅ Toast notifications functioning

### Performance

- ✅ Modal open time < 100ms
- ✅ No memory leaks
- ✅ Smooth 60fps animations
- ✅ Minimal bundle size impact

### Accessibility

- ✅ WCAG 2.1 AA compliance
- ✅ Screen reader compatibility
- ✅ Keyboard navigation support
- ✅ Focus trap working correctly

### Developer Experience

- ✅ Simple API để sử dụng
- ✅ TypeScript support hoàn chỉnh
- ✅ Good documentation
- ✅ Easy customization options
