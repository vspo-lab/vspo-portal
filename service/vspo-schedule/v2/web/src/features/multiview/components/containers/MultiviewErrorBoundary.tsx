import { Box, Button, Typography } from "@mui/material";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import React from "react";

type Props = {
  children: React.ReactNode;
  /** Fallback message shown when an error is caught. */
  fallbackMessage?: string;
};

type State = {
  readonly hasError: boolean;
};

/**
 * Error boundary that catches render errors in the multiview feature tree.
 *
 * @precondition Must wrap React component subtrees that may throw during render.
 * @postcondition On error, renders a recoverable fallback UI instead of crashing the page.
 * @idempotent Resetting clears the error state and re-mounts children.
 */
export class MultiviewErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  override componentDidCatch(error: Error, info: React.ErrorInfo): void {
    console.error("[MultiviewErrorBoundary]", error, info.componentStack);
  }

  private readonly handleReset = (): void => {
    this.setState({ hasError: false });
  };

  override render(): React.ReactNode {
    if (this.state.hasError) {
      return (
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            height: "100%",
            minHeight: 200,
            gap: 2,
            p: 3,
            textAlign: "center",
          }}
        >
          <ErrorOutlineIcon sx={{ fontSize: 48, opacity: 0.6 }} />
          <Typography variant="body1">
            {this.props.fallbackMessage ?? "予期しないエラーが発生しました"}
          </Typography>
          <Button variant="outlined" onClick={this.handleReset}>
            再試行
          </Button>
        </Box>
      );
    }

    return this.props.children;
  }
}
