import { motion } from "framer-motion";

const Input = ({
  icon: Icon,
  type,
  placeholder,
  name,
  value,
  onChange,
  required = false,
  className = "",
}) => {
  return (
    // 👉 'group' class allows the icon to react when the input is focused
    <div className="relative w-full group">
      {/* Interactive Icon */}
      {Icon && (
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-lg pointer-events-none z-10 transition-colors duration-300 group-focus-within:text-teal-500">
          <Icon />
        </div>
      )}

      <motion.input
        whileFocus={{ scale: 1.01 }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
        type={type}
        name={name}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        required={required}
        // 👉 SOLID DARK THEME: Deep inset background with crisp focus borders
        className={`w-full bg-slate-950 border border-slate-800 rounded-2xl py-4 pr-4 text-white text-base md:text-sm placeholder-slate-600 outline-none focus:border-teal-500 focus:bg-slate-900 shadow-inner transition-all ${
          Icon ? "pl-12" : "pl-5"
        } ${className}`}
      />
    </div>
  );
};

export default Input;