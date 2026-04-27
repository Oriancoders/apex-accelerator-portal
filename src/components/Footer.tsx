import BrandColumn from "@/components/footer/BrandColumn";
import FooterBottomBar from "@/components/footer/FooterBottomBar";
import FooterLinkColumns from "@/components/footer/FooterLinkColumns";
import {
  footerBottomLinks,
  footerContactItems,
  footerLinks,
  footerSocialLinks,
} from "@/components/footer/data";

export default function Footer() {
  return (
    <footer className="border-t border-border-subtle bg-surface-elevated/80 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 lg:py-24">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 lg:gap-12">
          <BrandColumn contacts={footerContactItems} socialLinks={footerSocialLinks} />
          <FooterLinkColumns groups={footerLinks} />
        </div>
      </div>

      <FooterBottomBar bottomLinks={footerBottomLinks} />
    </footer>
  );
}
