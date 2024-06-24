import React, { ButtonHTMLAttributes } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement>;

const stylesByType = (type: any) => {
  switch (type) {
    default:
      return "flex items-center justify-center rounded-md bg-[#8ee00b] px-4 py-2 font-medium shadow  transition-all duration-200 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-tone6l focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";
  }
};

const Button: React.FC<ButtonProps> = ({
  children,
  type,
  className,
  ...rest
}) => {
  return (
    <button className={stylesByType(type) + " " + className} {...rest}>
      {children}
    </button>
  );
};

export default Button;
