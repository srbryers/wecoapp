import { FC } from 'react'

type DividerProps = {
  className?: string
}

const Divider: FC<DividerProps> = ({ className }) => {
  return (
    <div className={`divider ${className || ""} h-[0] w-full border-b border-gray-950`}></div>
  );
}

export default Divider;