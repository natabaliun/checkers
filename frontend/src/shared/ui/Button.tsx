import React from 'react';
type Props = { children: React.ReactNode; onClick: () => void; };
export const Button = ({ children, onClick }: Props) => <button onClick={onClick}>{children}</button>;