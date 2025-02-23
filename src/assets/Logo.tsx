import React from 'react';

export default function Logo() {
  return (
    <svg width="64" height="64" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="32" height="32" rx="4" fill="#facc15"/>
      <rect x="2" y="2" width="28" height="28" rx="3" fill="none" stroke="black" strokeWidth="2"/>
      <path d="M10 8H22V12H14V14H20V18H14V24H10V8Z" fill="black"/>
    </svg>
  );
}