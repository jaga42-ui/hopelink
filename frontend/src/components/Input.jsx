import { motion } from 'framer-motion';

const Input = ({ icon: Icon, type, placeholder, name, value, onChange, required = false, className = "" }) => {
  return (
    // 👉 Added 'group' class here to allow the icon to react when the input is focused
    <div className="relative w-full group">
      
      {/* Interactive Icon */}
      {Icon && (
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 text-lg pointer-events-none z-10 transition-colors duration-300 group-focus-within:text-white/80">
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
        // 👉 GLASSMORPHISM 2.0: Frosted background, interactive borders, and glowing shadow on focus
        className={`w-full bg-black/20 backdrop-blur-xl border border-white/10 rounded-2xl py-4 pr-4 text-white text-base md:text-sm placeholder-white/30 outline-none focus:border-white/40 focus:bg-black/40 focus:shadow-[0_0_20px_rgba(255,255,255,0.05)] transition-all ${
          Icon ? 'pl-12' : 'pl-5'
        } ${className}`}
      />
    </div>
  );
};

export default Input;