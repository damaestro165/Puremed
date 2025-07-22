
import { Link } from 'react-router-dom';

type CategoryCardProps = {
  title: string;
  image: string;
  link: string;
}

const CategoryCard = ({title, image, link}:CategoryCardProps) => {
  return (
    <div className='border rounded-lg shadow-md hover:shadow-lg transition duration-300 ease-in-out'>
        <Link to={link} className="flex flex-col justify-center items-center w-full">
            <div className="flex justify-center items-center w-full p-2 gap-2">
                <img src={image} alt={title} className="w-16 h-16 object-fit rounded-lg" />
                <h3 className="text-sm lg:text-md text-center font-semibold text-[#2D3748]">{title}</h3>
            </div>
        </Link>
    </div>
  )
}

export default CategoryCard