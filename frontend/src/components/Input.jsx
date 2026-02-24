import { motion } from 'framer-motion';

const Input = ({ icon: Icon, type, placeholder, name, value, onChange, required = false }) => {
  return (
    <div className="relative w-full">
      {/* Absolute positioning for the icon to keep it perfectly centered vertically */}
      {Icon && (
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 text-sm pointer-events-none z-10">
          <Icon size={16} />
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
        // 👉 text-base prevents iOS Safari zoom. bg-[#111] matches the stealth aesthetic.
        className={`w-full bg-[#111] border border-white/10 rounded-2xl py-3.5 sm:py-4 pr-4 text-white text-base sm:text-sm placeholder-white/20 outline-none focus:border-teal-500 focus:bg-black transition-colors shadow-inner ${
          Icon ? 'pl-10 sm:pl-12' : 'pl-4 sm:pl-5'
        }`}
      />
    </div>
  );
};

export default Input;