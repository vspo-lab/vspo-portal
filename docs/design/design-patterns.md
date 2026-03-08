# Design Patterns

## Overview

Design patterns are proven solutions to recurring UI challenges. This guideline defines 8 major design patterns.

## Eye Flow Guidance

Patterns that design the flow of the user's gaze to naturally guide them to important information.

### Fundamental Principles

#### 1. The eye moves from top to bottom

| Pattern | Characteristics | Application |
|---------|----------------|-------------|
| F-pattern | Left-to-right, then downward repeatedly | List screens, settings screens, screens with vertically stacked information |
| Z-pattern | Top-left to top-right, bottom-left to bottom-right | Modals, login screens, first-visit screens or screens with little scrolling |

#### 2. The eye moves from large elements to small elements

Use heading levels in order and make inner padding narrower than outer padding to achieve hierarchical eye flow guidance.

### Implementation Notes

- Recognize that principles may not apply when users have a clear objective
- Be aware that multiple principles interact with each other
- Set "starting points and boundaries for eye movement" using headings and whitespace
- Consider variations in effectiveness across devices and screen widths
- Combine with accessibility support; do not rely solely on eye flow guidance

## Visual Grouping

Patterns that give visual cohesion to multiple related elements.

### 3 Expression Methods

| Method | Characteristics | Use Case |
|--------|----------------|----------|
| Whitespace | Reduces screen complexity | When elements can be arranged by relevance |
| Rectangle | Clarifies group boundaries | When containing multiple sub-groups |
| Divider line | Displays clear boundaries | Last resort when whitespace or rectangles are insufficient |

### Hierarchy Structure

```
Section (heading + content)
+-- Block (group within a section)
    +-- Element
```

### Design Guidelines

- **Maintain consistency**: Apply the same grouping method to elements at the same hierarchy level
- **Be cautious of hierarchy depth**: Deeper hierarchies make it harder to understand information relationships
- **Use TabBar/SideNav**: Use dedicated components for switching between multiple sections

## Page Layout

Patterns for designing the overall page structure.

### Basic Structure

```
+-----------------------------+
|         AppHeader           |
+-----------------------------+
| Container                   |
| +-------------------------+ |
| | Page Title + Lead Text  | |
| +-------------------------+ |
| |                         | |
| |      Main Content       | |
| |                         | |
| +-------------------------+ |
+-----------------------------+
```

### 6 Layout Types

| Type | Description | Usage |
|------|-------------|-------|
| Collection (Table/List) | Display a list of objects | Article list, user list |
| Single (1-Column) | Sections with parallel information | Detail page, settings screen |
| Single (2-Column) | Distinguishing primary/secondary information | Profile, dashboard |
| Single (Custom View) | 2D interactive content | Map, chart |
| Side Navigation + Content | Extensive navigation | Settings, documentation |
| Collection + Single | List-detail pair display | Email, chat |

### Lead Text

Implement lead text in the header area so users can quickly understand the page's purpose.

```tsx
<header>
  <h1>Article List</h1>
  <p className="text-text-secondary">
    Manage published articles. Create new articles or edit existing ones.
  </p>
</header>
```

### Page Length Management

Methods to avoid excessively long vertical scrolling:

- Collapse content with disclosure widgets
- Split pages using TabBar, SideNav, or SideMenu
- Reduce information density

## Mobile Layout

UI design patterns for smartphones.

### Core Principles

| Item | Desktop | Mobile |
|------|---------|--------|
| Columns | Multi-column possible | Single column recommended |
| Scrolling | 2D possible (maps, etc.) | Vertical scrolling only recommended |
| Information volume | Detailed display possible | Selected information only |
| Operations | Multiple operations possible | Limited to simple operations |

### Design Approach

```tsx
// Responsive vs Adaptive
// Responsive: Same elements, structure, and data; only layout changes
// Adaptive: Structure, data, and presentation change based on screen width or device
```

### Implementation

```tsx
// Mobile detection
const { isMobile } = useEnvironment();

// Responsive classes
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
  {/* Cards */}
</div>
```

## Feedback

Patterns for designing responses to user actions.

### Core Principles

| Principle | Description |
|-----------|-------------|
| Passive recognition | Users can understand the result without actively checking |
| Proximity display | Display feedback near the element that was operated on |
| Screen reader support | Maintain appropriate reading order |

### Feedback Patterns

#### Form Input & Submission

```tsx
// Validation error
<FormControl error={!!errors.email}>
  <Label>Email Address</Label>
  <Input {...register("email")} />
  {errors.email && <ErrorMessage>{errors.email.message}</ErrorMessage>}
</FormControl>
```

#### Processing State

```tsx
<Button loading={isSubmitting}>
  {isSubmitting ? "Submitting..." : "Submit"}
</Button>
```

#### Completion Notification

```tsx
// On success
<ResponseMessage status="success">
  Saved successfully
</ResponseMessage>

// On error
<ResponseMessage status="error">
  Failed to save. Please try again.
</ResponseMessage>
```

## Modal UI

Modal UI patterns for completing specific tasks.

### Use Cases

| Scenario | Example |
|----------|---------|
| Adding/editing objects | Creating articles, editing profiles |
| Sorting data | Sort settings for lists |
| Importing/exporting data | CSV import/export |
| Confirming destructive actions | Delete confirmation |
| Complex sequential operations | Wizards |

### Implementation Patterns

| Pattern | Component | Usage |
|---------|-----------|-------|
| Modal dialog | Dialog | Small to medium forms |
| Full-page mode | FloatArea | When there is a large amount of information |
| Partial-page mode | Drawer | Maintain awareness of original layout |
| Step-based | StepFormDialog | Multi-step operations |

### Components

```tsx
<Dialog>
  <DialogTitle>Create Article</DialogTitle>
  <DialogDescription>Enter the information for the new article.</DialogDescription>

  <DialogContent>
    <FormControl>
      <Label>Title</Label>
      <Input />
    </FormControl>
  </DialogContent>

  <DialogActions>
    <Button variant="ghost" onClick={onCancel}>Cancel</Button>
    <Button onClick={onSubmit}>Create</Button>
  </DialogActions>
</Dialog>
```

### Accessibility

**Avoid disabling the submit button.** Even when there are input errors, let the user press the button and then display error feedback.

## Wizard

Patterns for completing operations across multiple steps.

### Use Cases

| Scenario | Example |
|----------|---------|
| Complex operations | Searching and selecting objects, editing files |
| Conditional branching | Subsequent items change based on input content |
| Confirmation with parameter input | Setting conditions before deletion |

### Core Principles

- **Avoid overuse**: Limit to particularly effective cases since it restricts user behavior
- **Show progress**: Always display the total number of steps and the current step

### Implementation

```tsx
<StepFormDialog
  currentStep={currentStep}
  totalSteps={3}
  title={`Import Articles (${currentStep}/3)`}
>
  {currentStep === 1 && <Step1 />}
  {currentStep === 2 && <Step2 />}
  {currentStep === 3 && <Step3 />}

  <DialogActions>
    {currentStep > 1 && (
      <Button variant="ghost" onClick={onBack}>Back</Button>
    )}
    <Button variant="ghost" onClick={onCancel}>Cancel</Button>
    {currentStep < 3 ? (
      <Button onClick={onNext}>Next</Button>
    ) : (
      <Button onClick={onComplete}>Import</Button>
    )}
  </DialogActions>
</StepFormDialog>
```

## Permission-Based Display Control

Patterns for controlling UI visibility based on user permissions.

### 4 Patterns

| Pattern | Behavior | Example |
|---------|----------|---------|
| A | Hide UI, hide reason | Do not show the feature at all to users without permission |
| B | Hide UI, show reason | Explanation for system-level permissions (cannot be deleted) |
| C | Disable UI, show reason | Cannot delete because it is in use |
| D | Show and enable UI | Normal state |

### Displaying the Reason

```tsx
// Display reason via Tooltip
<Tooltip content="This permission cannot be deleted because it is used by the system">
  <Button disabled>Delete</Button>
</Tooltip>

// Using disabledReason
<Button
  disabled
  disabledReason="Cannot delete because another user is currently editing"
>
  Delete
</Button>
```

### Writing Guidelines

| Situation | Expression |
|-----------|------------|
| User can take action | "Cannot [action] because [reason]" |
| User cannot take action | "Cannot [action]" |

## References

- [Design Principles](./design-principles.md)
- [Accessibility Guidelines](./accessibility.md)
- [Styling](../web-frontend/styling.md)
