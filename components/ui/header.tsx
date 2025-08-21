"use client";

import { useState, useEffect } from "react";
import { Mail, Sparkles, Menu, X } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";

interface HeaderProps {
  activeSection?: string;
}

const navigationItems = [
  {
    id: "generador",
    label: "Generador Principal",
    href: "#generador",
    description: "Crear broadcasts de email",
  },
  {
    id: "entrenar-asuntos",
    label: "Entrenar con Asuntos",
    href: "#entrenar-asuntos",
    description: "Subir ejemplos de asuntos exitosos",
  },
  {
    id: "entrenar-imagenes",
    label: "Entrenar con Imágenes",
    href: "#entrenar-imagenes",
    description: "Subir capturas de emails exitosos",
  },
];

export function Header({ activeSection = "generador" }: HeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [currentSection, setCurrentSection] = useState(activeSection);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      const offset = 100; // Account for fixed header height
      const elementPosition = element.offsetTop - offset;

      window.scrollTo({
        top: elementPosition,
        behavior: "smooth",
      });

      setCurrentSection(sectionId);
      setIsMenuOpen(false);
    }
  };

  // Track scroll position to highlight active section
  useEffect(() => {
    const handleScroll = () => {
      const sections = navigationItems.map((item) => item.id);
      const scrollPosition = window.scrollY + 150;

      for (const sectionId of sections) {
        const element = document.getElementById(sectionId);
        if (element) {
          const { offsetTop, offsetHeight } = element;
          if (
            scrollPosition >= offsetTop &&
            scrollPosition < offsetTop + offsetHeight
          ) {
            setCurrentSection(sectionId);
            break;
          }
        }
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header className="sticky top-0 z-50 bg-gradient-to-r from-lime-50 via-cyan-50 to-blue-50 backdrop-blur-md border-b border-lime-200/30 shadow-sm">
      <div className="container mx-auto px-4 py-4">
        {/* Main Header Content */}
        <div className="flex items-center justify-between">
          {/* Logo and Title */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Image
                src="https://storage.googleapis.com/media-topfinanzas-com/images/topnetworks-positivo-sinfondo.webp"
                alt="TopNetworks Logo"
                width={280}
                height={88}
                className="h-12 w-auto"
                priority
              />
            </div>
            <div className="flex items-center gap-2">
              <Mail className="h-6 w-6 text-lime-600" />
              <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 via-cyan-600 to-lime-600 bg-clip-text text-transparent">
                EmailGenius
              </h1>
              <Sparkles className="h-6 w-6 text-cyan-500" />
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navigationItems.map((item) => (
              <Button
                key={item.id}
                variant="ghost"
                size="sm"
                onClick={() => scrollToSection(item.id)}
                className={`text-sm font-medium transition-all duration-200 ${
                  currentSection === item.id
                    ? "bg-gradient-to-r from-lime-500 to-cyan-500 text-white shadow-md hover:from-lime-500 hover:to-cyan-500 hover:text-white"
                    : "text-gray-600 hover:text-gray-900 hover:bg-lime-50"
                }`}
              >
                {item.label}
              </Button>
            ))}
          </nav>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="sm"
            className="md:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </Button>
        </div>

        {/* Subtitle - Always visible */}
        <div className="text-center mt-3">
          <h2 className="text-lg font-bold bg-gradient-to-r from-blue-600 via-cyan-600 to-lime-600 bg-clip-text text-transparent">
            Generador de Broadcasts de Email
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Plataforma Profesional de Marketing por Email para ConvertKit y
            ActiveCampaign
          </p>
        </div>

        {/* Mobile Navigation Menu */}
        {isMenuOpen && (
          <div className="md:hidden mt-4 p-4 bg-white rounded-lg shadow-lg border border-lime-200">
            <nav className="space-y-2">
              {navigationItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => scrollToSection(item.id)}
                  className={`w-full text-left p-3 rounded-md transition-all duration-200 ${
                    currentSection === item.id
                      ? "bg-gradient-to-r from-lime-500 to-cyan-500 text-white hover:from-lime-500 hover:to-cyan-500"
                      : "text-gray-600 hover:bg-lime-50 hover:text-gray-900"
                  }`}
                >
                  <div className="font-medium">{item.label}</div>
                  <div
                    className={`text-xs mt-1 ${
                      currentSection === item.id
                        ? "text-lime-100"
                        : "text-gray-500"
                    }`}
                  >
                    {item.description}
                  </div>
                </button>
              ))}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
