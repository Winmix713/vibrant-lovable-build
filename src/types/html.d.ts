
import React from 'react';

declare module 'react' {
  interface InputHTMLAttributes<T> extends HTMLAttributes<T> {
    // Add non-standard but commonly used directory input properties
    webkitdirectory?: string;
    directory?: string;
  }
}
