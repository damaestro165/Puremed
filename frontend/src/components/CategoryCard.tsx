import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

type CategoryCardProps = {
  title: string;
  image: string;
  link: string;
}

const CategoryCard = ({ title, image, link }: CategoryCardProps) => {
  return (
    <div className='group bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100'>
      <Link to={link} className="block">
        <div className="relative p-6">
          <div className="flex flex-col items-center space-y-4">
            <div className="relative">
              <div className="w-20 h-20 rounded-2xl overflow-hidden bg-gradient-to-br from-blue-50 to-indigo-100 p-3 group-hover:scale-110 transition-transform duration-300">
                <img 
                  src={image} 
                  alt={title} 
                  className="w-full h-full object-cover rounded-xl"
                />
              </div>
              <div className="absolute -inset-1 bg-gradient-to-r from-[#3182CE] to-blue-600 rounded-2xl opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
            </div>
            <div className="text-center">
              <h3 className="text-sm lg:text-base font-bold text-[#2D3748] group-hover:text-[#3182CE] transition-colors duration-200">
                {title}
              </h3>
            </div>
          </div>
          <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-all duration-200 transform translate-x-2 group-hover:translate-x-0">
            <ArrowRight className="w-4 h-4 text-[#3182CE]" />
          </div>
        </div>
      </Link>
    </div>
  )
}

export default CategoryCard