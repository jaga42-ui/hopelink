import { useState } from "react";
import { motion } from "framer-motion";
import { FaEye, FaEyeSlash } from "react-icons/fa";

const Input = ({
  icon: Icon, type = "text", placeholder, name, value, onChange, required = false, className = "", ...rest
}) => {
  const [showPassword, setShowPassword] = useState(false);

  const isPasswordField = type === "password";
  const currentType = isPasswordField && showPassword ? "text" : type;

  return (
    <div className="relative w-full group font-sans">
      {/* Interactive Left Icon */}
      {Icon && (
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-dusty-lavender text-lg pointer-events-none z-10 transition-colors duration-300 group-focus-within:text-blazing-flame">
          <Icon />
        </div>
      )}

      <motion.input
        whileFocus={{ scale: 1.01 }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
        type={currentType}
        name={name}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        required={required}
        className={`w-full bg-white border border-dusty-lavender/40 rounded-2xl py-3.5 text-pine-teal text-base md:text-sm placeholder-dusty-lavender/70 outline-none focus:border-blazing-flame focus:ring-4 focus:ring-blazing-flame/10 shadow-inner transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
          Icon ? "pl-11" : "pl-5"
        } ${isPasswordField ? "pr-12" : "pr-4"} ${className}`}
        {...rest} 
      />

      {/* Password Visibility Toggle */}
      {isPasswordField && (
        <button
          type="button"
          tabIndex="-1"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-dusty-lavender hover:text-blazing-flame transition-colors p-1 active:scale-90"
        >
          {showPassword ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
        </button>
      )}
    </div>
  );
};

export default Input;