import React, { useState, useEffect, useRef } from 'react'
import { categories } from '../assets/assets'
import { useAppContext } from '../context/AppContext'

const Categories = () => {
    const { navigate } = useAppContext()
    const [currentIndex, setCurrentIndex] = useState(0)
    const sliderRef = useRef(null)

    // Set up auto-sliding effect
    useEffect(() => {
        const interval = setInterval(() => {
            // Update index to create rotation effect
            setCurrentIndex((prevIndex) => 
                prevIndex === categories.length - 1 ? 0 : prevIndex + 1
            )
        }, 5000) // 3 seconds interval

        return () => clearInterval(interval) // Cleanup on unmount
    }, [])

    // Create circular array for smooth rotation
    const getVisibleCategories = () => {
        const visibleItems = []
        for (let i = 0; i < categories.length; i++) {
            const index = (currentIndex + i) % categories.length
            visibleItems.push(categories[index])
        }
        return visibleItems
    }

    return (
        <div className='mt-16'>
            <h1 className='text-2xl md:text-4xl font-avenir italic font-bold w-2xs'>Categories</h1>
            <div 
                ref={sliderRef}
                className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 mt-6 gap-6 overflow-hidden'
            >
                {getVisibleCategories().map((category, index) => (
                    <div 
                        key={index} 
                        className='group cursor-pointer py-5 px-3 gap-2 rounded-lg flex flex-col justify-center items-center transition-all duration-500'
                        style={{backgroundColor: category.bgColor}}
                        onClick={() => {
                            navigate(`/products/${category.path.toLowerCase()}`);
                            scrollTo(0, 0)
                        }}
                    >
                        <img 
                            src={category.image} 
                            alt={category.text} 
                            className='group-hover:scale-108 transition max-w-28'
                        />
                        <p className='text-sm font-medium'>{category.text}</p>
                    </div>
                ))}
            </div>
        </div>
    )
}

export default Categories
