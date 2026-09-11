"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <Card className="border-destructive/50">
            <CardContent className="flex flex-col items-center gap-3 py-8">
              <AlertTriangle className="h-8 w-8 text-destructive" />
              <p className="text-sm text-muted-foreground">
                Component failed to load
              </p>
              <p className="text-xs text-muted-foreground max-w-md text-center">
                {this.state.error?.message}
              </p>
              <Button
                size="sm"
                variant="outline"
                onClick={() => this.setState({ hasError: false })}
              >
                Try again
              </Button>
            </CardContent>
          </Card>
        )
      );
    }

    return this.props.children;
  }
}
