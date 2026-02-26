import { useState } from "react";
import { motion } from "framer-motion";
import { FaEye, FaEyeSlash } from "react-icons/fa";

const Input = ({
  icon: Icon,
  type = "text",
  placeholder,
  name,
  value,
  onChange,
  required = false,
  className = "",
  ...rest // 👉 THE FIX: Catches all other standard HTML input props (min, max, disabled, etc.)
}) => {
  const [showPassword, setShowPassword] = useState(false);

  // Determine actual input type based on the toggle state
  const isPasswordField = type === "password";
  const currentType = isPasswordField && showPassword ? "text" : type;

  return (
    <div className="relative w-full group">
      {/* Interactive Left Icon */}
      {Icon && (
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-lg pointer-events-none z-10 transition-colors duration-300 group-focus-within:text-teal-500">
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
        // 👉 SOLID DARK THEME: Includes disabled state styling and dynamic padding for the right eye icon
        className={`w-full bg-slate-950 border border-slate-800 rounded-2xl py-3.5 text-white text-base md:text-sm placeholder-slate-600 outline-none focus:border-teal-500 focus:bg-slate-900 shadow-inner transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
          Icon ? "pl-11" : "pl-5"
        } ${isPasswordField ? "pr-12" : "pr-4"} ${className}`}
        {...rest} // Injects things like autoComplete="off", min="1", step="any", etc.
      />

      {/* 👉 NEW: Password Visibility Toggle */}
      {isPasswordField && (
        <button
          type="button"
          tabIndex="-1" // Prevents the user from accidentally tabbing to the eye icon
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-teal-400 transition-colors p-1 active:scale-90"
        >
          {showPassword ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
        </button>
      )}
    </div>
  );
};

export default Input;
