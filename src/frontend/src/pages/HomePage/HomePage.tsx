import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  User, 
  Search, 
  ShoppingCart, 
  Cpu, 
  Monitor, 
  HardDrive, 
  MemoryStick, 
  Zap, 
  Box, 
  Fan, 
  MonitorSpeaker,
  Keyboard,
  Award,
  Shield,
  ChevronLeft,
  ChevronRight,
  ArrowRight
} from 'lucide-react';
import { Card, CardImage, CardBody, CardFooter } from '../../components/ui-kit/Card';
import heroContent from '../../assets/content/hero.json';
import productsContent from '../../assets/content/products.json';
import './HomePage.css';

const iconMap: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  award: Award,
  cpu: Cpu,
  shield: Shield,
  gpu: Monitor,
  memory: MemoryStick,
  storage: HardDrive,
  power: Zap,
  case: Box,
  cooling: Fan,
  monitor: MonitorSpeaker,
  peripherals: Keyboard,
};

const categoryIconMap: Record<string, React.ComponentType<{ size?: number }>> = {
  gpu: Monitor,
  cpu: Cpu,
  ram: MemoryStick,
  storage: HardDrive,
  psu: Zap,
  case: Box,
  cooling: Fan,
  monitor: MonitorSpeaker,
};

const heroVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.6,
      staggerChildren: 0.15
    }
  }
};

const heroItemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.33, 1, 0.68, 1]
    }
  }
};

const cardVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.33, 1, 0.68, 1]
    }
  }
};

const categoryVariants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.4,
      ease: [0.33, 1, 0.68, 1]
    }
  }
};

const featureVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.5,
      ease: [0.33, 1, 0.68, 1]
    }
  }
};

/**
 * HomePage - Main landing page for GoldPC
 * Dark Gold Theme with Framer Motion animations
 */
export function HomePage() {
  const { hero } = heroContent;
  const { products, categories } = productsContent;
  
  const featuredProducts = products.filter(p => p.isFeatured).slice(0, 4);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ru-RU').format(price) + ' ₽';
  };

  return (
    <div className="homePage">
      {/* Navigation Bar */}
      <nav className="navbar">
        <div className="navbarContainer">
          <Link to="/" className="logo">
            <span className="logoGold">Gold</span>
            <span className="logoWhite">PC</span>
          </Link>
          
          <div className="searchBar">
            <Search size={18} className="searchIcon" />
            <input 
              type="text" 
              placeholder="Поиск компонентов..."
              className="searchInput"
            />
          </div>
          
          <div className="navActions">
            <Link to="/account" className="navAction" aria-label="Аккаунт">
              <User size={22} />
            </Link>
            <Link to="/cart" className="navAction" aria-label="Корзина">
              <ShoppingCart size={22} />
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <motion.section 
        className="hero"
        variants={heroVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="heroBackground">
          <div className="heroOverlay"></div>
        </div>
        
        <div className="heroContent">
          <motion.h1 className="heroTitle" variants={heroItemVariants}>
            <span className="heroTitleGold">Performance</span>
            <span className="heroTitleWhite">in Gold</span>
          </motion.h1>
          
          <motion.p className="heroSubtitle" variants={heroItemVariants}>
            {hero.headline}
          </motion.p>
          
          <motion.div className="heroCta" variants={heroItemVariants}>
            <Link to={hero.cta.link} className="heroCtaBtn">
              <span>{hero.cta.text}</span>
              <ArrowRight size={20} />
            </Link>
          </motion.div>
          
          <motion.div className="heroFeatures" variants={heroItemVariants}>
            {hero.features.map((feature, index) => {
              const Icon = iconMap[feature.icon] || Award;
              return (
                <motion.div 
                  key={index} 
                  className="heroFeature"
                  variants={featureVariants}
                >
                  <div className="heroFeatureIcon">
                    <Icon size={24} />
                  </div>
                  <div className="heroFeatureContent">
                    <h3>{feature.title}</h3>
                    <p>{feature.description}</p>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </motion.section>

      {/* Featured Builds Section */}
      <section className="featuredBuilds">
        <div className="featuredBuildsHeader">
          <h2 className="featuredBuildsTitle">Gold Edition Builds</h2>
          <div className="featuredBuildsNav">
            <button className="featuredBuildsNavBtn" aria-label="Предыдущий">
              <ChevronLeft size={24} />
            </button>
            <button className="featuredBuildsNavBtn" aria-label="Следующий">
              <ChevronRight size={24} />
            </button>
          </div>
        </div>
        
        <motion.div 
          className="featuredBuildsCarousel"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={{
            visible: {
              transition: { staggerChildren: 0.1 }
            }
          }}
        >
          {featuredProducts.map((product) => (
            <motion.div key={product.id} variants={cardVariants}>
              <Card variant="gold-glass" className="buildCard">
                <CardImage 
                  src={`/assets/products/${product.id}.png`}
                  alt={product.name}
                />
                <CardBody>
                  <h3 className="buildCardName">{product.name}</h3>
                  <p className="buildCardType">
                    {categories.find(c => c.id === product.category)?.name || 'Gaming PC'}
                  </p>
                  <div className="buildCardRating">
                    <span className="buildCardStars">
                      {'★'.repeat(Math.floor(product.rating.average))}
                      {'☆'.repeat(5 - Math.floor(product.rating.average))}
                    </span>
                    <span className="buildCardReviews">
                      ({product.rating.count})
                    </span>
                  </div>
                </CardBody>
                <CardFooter>
                  <p className="buildCardPrice">
                    {formatPrice(product.price)}
                  </p>
                  {product.oldPrice && (
                    <p className="buildCardOldPrice">
                      {formatPrice(product.oldPrice)}
                    </p>
                  )}
                  <button className="buildCardBtn">
                    Подробнее
                  </button>
                </CardFooter>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Categories Section */}
      <section className="categories">
        <h2 className="categoriesTitle">Категории</h2>
        
        <motion.div 
          className="categoriesGrid"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={{
            visible: {
              transition: { staggerChildren: 0.05 }
            }
          }}
        >
          {categories.map((category) => {
            const Icon = categoryIconMap[category.id] || Box;
            return (
              <motion.div key={category.id} variants={categoryVariants}>
                <Link 
                  to={`/catalog?category=${category.slug}`}
                  className="categoryCard"
                >
                  <span className="categoryCardIcon">
                    <Icon size={32} />
                  </span>
                  <span className="categoryCardName">{category.name}</span>
                  <span className="categoryCardCount">
                    {category.productCount} шт
                  </span>
                </Link>
              </motion.div>
            );
          })}
        </motion.div>
      </section>
    </div>
  );
}