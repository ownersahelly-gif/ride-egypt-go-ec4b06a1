import { Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAppSettings } from '@/hooks/useAppSettings';

const Footer = () => {
  const { t, lang, appName } = useLanguage();
  const { settings } = useAppSettings();

  const contactPhone = settings.contact_phone;
  const contactEmail = settings.contact_email;
  const contactWhatsapp = settings.contact_whatsapp;
  const socialFacebook = settings.social_facebook;
  const socialInstagram = settings.social_instagram;
  const socialTwitter = settings.social_twitter;

  return (
    <footer className="border-t border-border py-12">
      <div className="container mx-auto px-4">
        <div className="grid sm:grid-cols-3 gap-8 mb-8">
          <div>
            <h3 className="text-xl font-bold text-primary font-arabic mb-2">
              {appName}
            </h3>
            <p className="text-muted-foreground text-sm">{t('footer.tagline')}</p>
          </div>
          <div>
            <h4 className="font-semibold text-foreground mb-3">{t('footer.company')}</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="#" className="hover:text-foreground transition-colors">{t('footer.about')}</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors">{t('footer.careers')}</a></li>
              {contactEmail ? (
                <li><a href={`mailto:${contactEmail}`} className="hover:text-foreground transition-colors">{contactEmail}</a></li>
              ) : (
                <li><a href="#" className="hover:text-foreground transition-colors">{t('footer.contact')}</a></li>
              )}
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-foreground mb-3">{t('footer.legal')}</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/legal?section=privacy" className="hover:text-foreground transition-colors">{t('footer.privacy')}</Link></li>
              <li><Link to="/legal?section=terms" className="hover:text-foreground transition-colors">{t('footer.terms')}</Link></li>
            </ul>
            {/* Social Links */}
            {(socialFacebook || socialInstagram || socialTwitter) && (
              <div className="flex gap-3 mt-4">
                {socialFacebook && <a href={socialFacebook} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground text-sm">Facebook</a>}
                {socialInstagram && <a href={socialInstagram} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground text-sm">Instagram</a>}
                {socialTwitter && <a href={socialTwitter} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground text-sm">Twitter</a>}
              </div>
            )}
          </div>
        </div>
        {/* Contact bar */}
        {(contactPhone || contactWhatsapp) && (
          <div className="flex items-center justify-center gap-4 mb-6 text-sm">
            {contactPhone && <a href={`tel:${contactPhone}`} className="text-muted-foreground hover:text-foreground">📞 {contactPhone}</a>}
            {contactWhatsapp && <a href={`https://wa.me/${contactWhatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground">💬 WhatsApp</a>}
          </div>
        )}
        <div className="border-t border-border pt-6 text-center text-sm text-muted-foreground">
          {t('footer.rights')}
        </div>
      </div>
    </footer>
  );
};

export default Footer;
