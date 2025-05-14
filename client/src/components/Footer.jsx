import { assets, footerLinks } from "../assets/assets";
import { NavLink } from 'react-router-dom'

const Footer = () => {

    return (
        <div className="px-6 md:px-16 lg:px-24 xl:px-32 mt-24 bg-primary/10">
            <div className="flex flex-col md:flex-row items-start justify-between gap-10 py-10 border-b border-gray-500/30 text-gray-500">
                <div>
                <NavLink to='/' className="text-2xl md:text-3xl lg:text-4xl font-semibold tracking-tight hover:text-primary transition-colors">
                    <h1 className="font-avenir font-black italic w-2xs">
                        Daggross
                    </h1>
                </NavLink>
                
                    <p className="max-w-[410px] mt-6">
                    En grossistlösning för företag som vill göra smarta inköp av matvaror. Med fokus på färskhet, tillgänglighet och service hjälper vi företag att få rätt varor i rätt tid – utan krångel.</p>
                </div>
                <div className="flex flex-wrap justify-between w-full md:w-[45%] gap-5">
                    {footerLinks.map((section, index) => (
                        <div key={index}>
                            <h3 className="font-semibold text-base text-gray-900 md:mb-5 mb-2">{section.title}</h3>
                            <ul className="text-sm space-y-1">
                                {section.links.map((link, i) => (
                                    <li key={i}>
                                        <a 
                                            href={link.url} 
                                            className="hover:underline transition"
                                            target={link.text === "Bli säljare" ? "_blank" : ""}
                                            rel={link.text === "Bli säljare" ? "noopener noreferrer" : ""}
                                        >
                                            {link.text}
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
            </div>
            <p className="py-4 text-center text-sm md:text-base text-gray-500/80">
                Copyright {new Date().getFullYear()} © Daggross.se Alla rättigheter förbehållna.
            </p>
        </div>
    );
};

export default Footer