import React, { useRef, useState, useEffect } from 'react'
import ProductCard from './ProductCard'
import { useAppContext } from '../context/AppContext';
import { assets } from '../assets/assets';

const BestSeller = () => {
    const { products } = useAppContext();
    const scrollContainerRef = useRef(null);
    const [currentPage, setCurrentPage] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [isAtStart, setIsAtStart] = useState(true);
    const [isAtEnd, setIsAtEnd] = useState(false);
    
    const filteredProducts = products.filter((product) => product.inStock).slice(0, 15);
    
    // Calculate total pages more accurately
    useEffect(() => {
        if (scrollContainerRef.current) {
            const calculateTotalPages = () => {
                const container = scrollContainerRef.current;
                const containerWidth = container.clientWidth;
                const totalWidth = container.scrollWidth;
                const pages = Math.max(1, Math.ceil(totalWidth / containerWidth));
                setTotalPages(pages);
            };
            
            calculateTotalPages();
            window.addEventListener('resize', calculateTotalPages);
            
            return () => window.removeEventListener('resize', calculateTotalPages);
        }
    }, [filteredProducts]);
    
    const handleScroll = (direction) => {
        if (scrollContainerRef.current) {
            const container = scrollContainerRef.current;
            const scrollAmount = direction === 'next' ? 
                container.offsetWidth : -container.offsetWidth;
            
            const newPosition = container.scrollLeft + scrollAmount;
            
            // Ensure we don't scroll beyond bounds
            const maxScroll = container.scrollWidth - container.clientWidth;
            const finalPosition = Math.max(0, Math.min(newPosition, maxScroll));
            
            container.scrollTo({
                left: finalPosition,
                behavior: 'smooth'
            });
            
            // Calculate new page after scrolling
            setTimeout(() => {
                updateCurrentPage();
            }, 300);
        }
    };
    
    const updateCurrentPage = () => {
        if (scrollContainerRef.current) {
            const container = scrollContainerRef.current;
            const maxScroll = container.scrollWidth - container.clientWidth;
            
            // Check if we're at start or end
            setIsAtStart(container.scrollLeft < 10);
            setIsAtEnd(Math.abs(container.scrollLeft - maxScroll) < 10);
            
            // Special handling for last page
            if (Math.abs(container.scrollLeft - maxScroll) < 10) {
                setCurrentPage(totalPages - 1);
            } else {
                const pageIndex = Math.round(container.scrollLeft / container.offsetWidth);
                setCurrentPage(pageIndex);
            }
        }
    };
    
    const handleScrollToPage = (pageIndex) => {
        if (scrollContainerRef.current) {
            const container = scrollContainerRef.current;
            
            // Handle last page specially
            if (pageIndex === totalPages - 1) {
                const maxScroll = container.scrollWidth - container.clientWidth;
                container.scrollTo({
                    left: maxScroll,
                    behavior: 'smooth'
                });
            } else {
                const newPosition = pageIndex * container.offsetWidth;
                container.scrollTo({
                    left: newPosition,
                    behavior: 'smooth'
                });
            }
            
            setCurrentPage(pageIndex);
        }
    };
    
    // Monitor scroll position
    useEffect(() => {
        const handleScrollUpdate = () => {
            updateCurrentPage();
        };
        
        const container = scrollContainerRef.current;
        if (container) {
            container.addEventListener('scroll', handleScrollUpdate);
            return () => container.removeEventListener('scroll', handleScrollUpdate);
        }
    }, [totalPages]);
    
    return (
        <div className='mt-16 relative'>
            <div className='flex items-center justify-between mb-4'>
                <p className='text-2xl md:text-4xl font-medium'>Populärt just nu</p>
                <div className='flex items-center gap-2'>
                    <button 
                        onClick={() => handleScroll('prev')}
                        className={`w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center transition-colors cursor-pointer ${
                            isAtStart ? 'bg-green-100/20 text-green-700/20 border-green-200/20' : 'hover:bg-green-50 hover:text-green-700'
                        }`}   
                        aria-label="Previous products"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M15 18l-6-6 6-6" />
                        </svg>
                    </button>
                    <button 
                        onClick={() => handleScroll('next')}
                        className={`w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center transition-colors cursor-pointer ${
                            isAtEnd ? 'bg-green-100/20 text-green-700/20 border-green-200/20' : 'hover:bg-green-50 hover:text-green-700'
                        }`}
                        aria-label="Next products"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M9 18l6-6-6-6" />
                        </svg>
                    </button>
                </div>
            </div>
            
            <div className="overflow-hidden relative">
                {/* Vänster fade-effekt */}
                <div className={`absolute left-0 top-0 h-full w-16 z-10 pointer-events-none
                    bg-gradient-to-r from-white to-transparent
                    ${isAtStart ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}>
                </div>
                
                <div 
                    ref={scrollContainerRef}
                    className="flex overflow-x-scroll no-scrollbar scroll-smooth"
                >
                    <div className="flex gap-4">
                        {filteredProducts.map((product, index) => (
                            <div key={index} className="w-56 flex-shrink-0">
                                <ProductCard product={product} />
                            </div>
                        ))}
                    </div>
                </div>
                
                {/* Höger fade-effekt */}
                <div className={`absolute right-0 top-0 h-full w-16 z-10 pointer-events-none
                    bg-gradient-to-l from-white to-transparent
                    ${isAtEnd ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}>
                </div>
            </div>
            
            {/* Pagination Indicator */}
            <div className="flex justify-center mt-6">
                <div className="flex items-center gap-1.5">
                    {Array.from({ length: totalPages }).map((_, index) => (
                        <button
                            key={index}
                            onClick={() => handleScrollToPage(index)}
                            className={`h-1.5 rounded-full transition-all ${
                                index === currentPage 
                                ? "w-4 md:w-16 bg-primary" 
                                : "w-2 md:w-8 bg-gray-300 hover:bg-primary/40"
                            }`}
                            aria-label={`Go to page ${index + 1}`}
                        />
                    ))}
                </div>
            </div>
        </div>
    )
}

export default BestSeller
