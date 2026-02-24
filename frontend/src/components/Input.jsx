import { motion } from 'framer-motion';

const Input = ({ icon: Icon, type, placeholder, name, value, onChange }) => {
  return (
    <div className="relative mb-4">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
        <Icon size={20} />
      </div>
      <motion.input 
        whileFocus={{ scale: 1.02, borderColor: "#60A5FA" }}
        type={type} 
        name={name}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className="w-full pl-10 pr-4 py-3 bg-gray-800/50 border border-gray-600 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
      />
    </div>
  );
};

export default Input;