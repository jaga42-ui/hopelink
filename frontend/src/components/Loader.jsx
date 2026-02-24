import { FaSpinner } from 'react-icons/fa';

const Loader = ({ fullScreen = false, text = "Loading..." }) => {
  const content = (
    <div className="flex flex-col items-center justify-center gap-4 text-teal-400">
      <FaSpinner className="animate-spin text-5xl drop-shadow-[0_0_15px_rgba(45,212,191,0.5)]" />
      <p className="text-white/50 font-bold uppercase tracking-widest text-xs animate-pulse">
        {text}
      </p>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-[#0a0a0a]/80 backdrop-blur-md z-[100] flex items-center justify-center">
        {content}
      </div>
    );
  }

  return <div className="p-8 flex justify-center w-full">{content}</div>;
};

export default Loader;