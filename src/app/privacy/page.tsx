'use client';
import React, { useEffect, useState } from 'react';
import {
    Box,
    Typography,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    List,
    ListItem,
    ListItemText,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

function PrivacyPolicies() {
  useEffect(() => {
        window.scrollTo({ top: 0 });
    }, []);

    const [expanded, setExpanded] = useState<string | false>(false);

    const handleChange = (panel: string) => (event: React.SyntheticEvent, isExpanded: boolean) => {
        setExpanded(isExpanded ? panel : false);
    };

    const sections = [
        {
            title: "Purpose of this Privacy Policy",
            content: [
                "This privacy notice for Champion Footballer, describes how and why we might collect, store, use, and/or share (\"process\") your information when you use our services (\"Services\") through your use of this website and any mobile application (\"Platform\").",
                "Questions or concerns? Reading this privacy notice will help you understand your privacy rights and choices. If you do not agree with our policies and practices, please do not use our Services. If you still have any questions or concerns, please contact us at championfootballer@outlook.com",
                "Champion Footballer respects your privacy and is dedicated to protecting your personal data. This privacy notice will inform you as to how we look after your personal data when you visit our Platform (regardless of where you visit it from) and tell you about your privacy rights and how the law protects you.",
                "We collect, use and are responsible for certain personal information about you. When we do so we are subject to relevant laws including, but not limited to, the General Data Protection Regulation, which applies across the European Union (including in the United Kingdom) and we are responsible as 'controller' of that personal information for the purposes of those laws.",
                "It is important that you read this privacy policy carefully together with any other privacy policy or fair processing policy we may provide on specific occasions when we are collecting or processing personal data about you so that you are fully aware of how and why we are using your data. This privacy policy supplements other notices and privacy policies and is not intended to override them."
            ]
        },
        {
            title: "Summary of Key Points",
            content: [
                "This summary provides key points from our privacy notice, but you can find out more details about any of these topics below or by using our table of contents below to find the section you are looking for.",
                "What personal information do we process? When you visit, use, or navigate our Services, we may process personal information depending on how you interact with Champion Footballer and the Services, the choices you make, and the products and features you use.",
                "Do we process any sensitive personal information? We process the following sensitive personal information; User first name, surname, age, gender and email. Any further change to processing sensitive personal information we will inform you about that practice in a revised version of this privacy notice.",
                "We keep our privacy policy under regular review. This version was last updated in August 2022.",
                "It is important that the personal data we hold about you is accurate and current. Please keep us informed if your personal data changes during your relationship with us.",
                "Do we receive any information from third parties? We may receive information from public databases, marketing partners, social media platforms, and other outside sources.",
                "How do we process your information? We process your information to provide, improve, and administer our Services, communicate with you, for security and fraud prevention, and to comply with law. We may also process your information for other purposes with your consent. We process your information only when we have a valid legal reason to do so.",
                "In what situations and with which parties do we share personal information? We may share information in specific situations and with specific third parties.",
                "What are your rights? Depending on where you are located geographically, the applicable privacy law may mean you have certain rights regarding your personal information.",
                "How do you exercise your rights? The easiest way to exercise your rights is by filling out our contact form or by contacting us. We will consider and act upon any request in accordance with applicable data protection laws."
            ]
        },
        {
            title: "Table of Contents",
            content: [
                "WHAT INFORMATION DO WE COLLECT?",
                "HOW DO WE PROCESS YOUR INFORMATION?",
                "WHEN AND WITH WHOM DO WE SHARE YOUR PERSONAL INFORMATION?",
                "DO WE USE COOKIES AND OTHER TRACKING TECHNOLOGIES?",
                "HOW DO WE HANDLE YOUR SOCIAL LOGINS?",
                "IS YOUR INFORMATION TRANSFERRED INTERNATIONALLY?",
                "HOW LONG DO WE KEEP YOUR INFORMATION?",
                "DO WE COLLECT INFORMATION FROM MINORS?",
                "WHAT ARE YOUR PRIVACY RIGHTS?",
                "CONTROLS FOR DO-NOT-TRACK FEATURES",
                "DO CALIFORNIA RESIDENTS HAVE SPECIFIC PRIVACY RIGHTS?",
                "DO WE MAKE UPDATES TO THIS NOTICE?",
                "HOW CAN YOU CONTACT US ABOUT THIS NOTICE?",
                "HOW CAN YOU REVIEW, UPDATE, OR DELETE THE DATA WE COLLECT FROM YOU?",
                "COOKIE POLICY"
            ]
        },
        {
            title: "What Information Do We Collect?",
            content: [
                "Personal information you disclose to us",
                "In Short: We collect personal information that you provide to us.",
                "We collect personal information that you voluntarily provide to us when you register on the Services, express an interest in obtaining information about us or our products and Services, when you participate in activities on the Services, or otherwise when you contact us.",
                "Personal data, or personal information, means any information about an individual from which that person can be identified. It does not include data where the identity has been removed (anonymous data).",
                "We may collect, use, store and transfer different kinds of personal data about you which we have grouped together as follows:",
                [
                    "Identity Data includes first name, maiden name, last name, username or similar identifier, age and gender.",
                    "Contact Data includes email address",
                    "Technical Data includes internet protocol (IP) address, your login data, browser type and version, time zone setting and location, browser plug-in types and versions, operating system and platform, and other technology on the devices you use to access this Platform.",
                    "Profile Data includes your username and password made by you, your interests, preferences, feedback and survey responses.",
                    "Usage Data includes information about how you use our Platform, products and services.",
                    "Marketing and Communications Data includes your preferences in receiving marketing from us and our third parties and your communication preferences."
                ],
                "We may also collect, use and share Aggregated Data such as statistical data for any purpose. Aggregated Data could be derived from your personal data but is not considered personal data in law as this data will not directly or indirectly reveal your identity. For example, we may aggregate your Usage Data to calculate the percentage of users accessing a specific Platform feature. However, if we combine or connect Aggregated Data with your personal data so that it can directly or indirectly identify you, we treat the combined data as personal data which will be used in accordance with this privacy policy.",
                "Sensitive Information. We do not process sensitive information.",
                "All personal information that you provide to us must be true, complete, and accurate, and you must notify us of any changes to such personal information.",
                "Information automatically collected",
                "In Short: Some information — such as your Internet Protocol (IP) address and/or browser and device characteristics — is collected automatically when you visit our Services.",
                "We automatically collect certain information when you visit, use, or navigate the Services. This information does not reveal your specific identity (like your name or contact information) but may include device and usage information, such as your IP address, browser and device characteristics, operating system, language preferences, referring URLs, device name, country, location, information about how and when you use our Services, and other technical information. This information is primarily needed to maintain the security and operation of our Services, and for our internal analytics and reporting purposes.",
                "Like many businesses, we also collect information through cookies and similar technologies."
            ]
        },
        {
            title: "How Do We Process Your Information?",
            content: [
                "In Short: We process your information to provide, improve, and administer our Services, communicate with you, for security and fraud prevention, and to comply with law. We may also process your information for other purposes with your consent.",
                "We process your information to provide, improve, and administer our Services, communicate with you, for security and fraud prevention, and to comply with law. We may also process your information for other purposes with your consent. We process your information only when we have a valid legal reason to do so."
            ]
        },
        {
            title: "When and With Whom Do We Share Your Personal Information?",
            content: [
                "In Short: We may share information in specific situations described in this section and/or with the following third parties.",
                "We may need to share your personal information in the following situations:",
                [
                    "Business Transfers. We may share or transfer your information in connection with, or during negotiations of, any merger, sale of company assets, financing, or acquisition of all or a portion of our business to another company.",
                    "Affiliates. We may share your information with our affiliates, in which case we will require those affiliates to honour this privacy notice. Affiliates include our parent company and any subsidiaries, joint venture partners, or other companies that we control or that are under common control with us.",
                    "Business Partners. We may share your information with our business partners to offer you certain products, services, or promotions."
                ]
            ]
        },
        {
            title: "Do We Use Cookies and Other Tracking Technologies?",
            content: [
                "In Short: We may use cookies and other tracking technologies to collect and store your information.",
                "We may use cookies and similar tracking technologies (like web beacons and pixels) to access or store information. Specific information about how we use such technologies and how you can refuse certain cookies is set out in our Cookie Notice."
            ]
        },
        {
            title: "How Do We Handle Your Social Logins?",
            content: [
                "In Short: We do not currently have a feature for you to register or log in to our services using a social media account, we may include this as an option in the future and when we do we will have access to certain information about you as follows;",
                "Our Services may offer you the ability to register and log in using your third-party social media account details (like your Facebook or Twitter logins). Where you choose to do this, we will receive certain profile information about you from your social media provider. The profile information we receive may vary depending on the social media provider concerned, but will often include your name, email address, friends list, and profile picture, as well as other information you choose to make public on such a social media platform.",
                "We will use the information we receive only for the purposes that are described in this privacy notice or that are otherwise made clear to you on the relevant Services. Please note that we do not control, and are not responsible for, other uses of your personal information by your third-party social media provider. We recommend that you review their privacy notice to understand how they collect, use, and share your personal information, and how you can set your privacy preferences on their sites and apps."
            ]
        },
        {
            title: "Is Your Information Transferred Internationally?",
            content: [
                "In Short: We may transfer, store, and process your information in countries other than your own.",
                "Our servers are located in. If you are accessing our Services from outside, please be aware that your information may be transferred to, stored, and processed by us in our facilities and by those third parties with whom we may share your personal information (see WHEN AND WITH WHOM DO WE SHARE YOUR PERSONAL INFORMATION? above), in and other countries.",
                "If you are a resident in the European Economic Area (EEA) or United Kingdom (UK), then these countries may not necessarily have data protection laws or other similar laws as comprehensive as those in your country. However, we will take all necessary measures to protect your personal information in accordance with this privacy notice and applicable law."
            ]
        },
        {
            title: "How Long Do We Keep Your Information?",
            content: [
                "In Short: We keep your information for as long as necessary to fulfil the purposes outlined in this privacy notice unless otherwise required by law.",
                "We will only keep your personal information for as long as it is necessary for the purposes set out in this privacy notice, unless a longer retention period is required or permitted by law (such as tax, accounting, or other legal requirements).",
                "When we have no ongoing legitimate business need to process your personal information, we will either delete or anonymize such information, or, if this is not possible (for example, because your personal information has been stored in backup archives), then we will securely store your personal information and isolate it from any further processing until deletion is possible."
            ]
        },
        {
            title: "Do We Collect Information From Minors?",
            content: [
                "In Short: We do not knowingly collect data from or market to children under 18 years of age.",
                "We do not knowingly solicit data from or market to children under 18 years of age. By using the Services, you represent that you are at least 18 or that you are the parent or guardian of such a minor and consent to such minor dependent's use of the Services. If we learn that personal information from users less than 18 years of age has been collected, we will deactivate the account and take reasonable measures to promptly delete such data from our records. If you become aware of any data we may have collected from children under age 18, please contact us at championfootballer@outlook.com."
            ]
        },
        {
            title: "What Are Your Privacy Rights?",
            content: [
                "In Short: You may review, change, or terminate your account at any time.",
                "If you are located in the EEA or UK and you believe we are unlawfully processing your personal information, you also have the right to complain to your local data protection supervisory authority. You can find their contact details here: https://ec.europa.eu/justice/data-protection/bodies/authorities/index_en.htm.",
                "If you are located in Switzerland, the contact details for the data protection authorities are available here: www.edoeb.admin.ch/edoeb/en/home.html",
                "Withdrawing your consent: If we are relying on your consent to process your personal information, which may be express and/or implied consent depending on the applicable law, you have the right to withdraw your consent at any time. You can withdraw your consent at any time by contacting us by using the contact details provided in the section HOW CAN YOU CONTACT US ABOUT THIS NOTICE? below.",
                "However, please note that this will not affect the lawfulness of the processing before its withdrawal nor, when applicable law allows, will it affect the processing of your personal information conducted in reliance on lawful processing grounds other than consent.",
                "Account Information",
                "If you would at any time like to review or change the information in your account or terminate your account, you can:",
                "Upon your request to terminate your account, we will deactivate or delete your account and information from our active databases. However, we may retain some information in our files to prevent fraud, troubleshoot problems, assist with any investigations, enforce our legal terms and/or comply with applicable legal requirements."
            ]
        },
        {
            title: "Controls for Do-Not-Track Features",
            content: [
                "Most web browsers and some mobile operating systems and mobile applications include a Do-Not-Track (\"DNT\") feature or setting you can activate to signal your privacy preference not to have data about your online browsing activities monitored and collected. At this stage no uniform technology standard for recognizing and implementing DNT signals has been finalized. As such, we do not currently respond to DNT browser signals or any other mechanism that automatically communicates your choice not to be tracked online. If a standard for online tracking is adopted that we must follow in the future, we will inform you about that practice in a revised version of this privacy notice."
            ]
        },
        {
            title: "Do California Residents Have Specific Privacy Rights?",
            content: [
                "In Short: Yes, if you are a resident of California, you are granted specific rights regarding access to your personal information.",
                "California Civil Code Section 1798.83, also known as the \"Shine The Light\" law, permits our users who are California residents to request and obtain from us, once a year and free of charge, information about categories of personal information (if any) we disclosed to third parties for direct marketing purposes and the names and addresses of all third parties with which we shared personal information in the immediately preceding calendar year. If you are a California resident and would like to make such a request, please submit your request in writing to us using the contact information provided below.",
                "If you are under 18 years of age, reside in California, and have a registered account with Services, you have the right to request removal of unwanted data that you publicly post on the Services. To request removal of such data, please contact us using the contact information provided below and include the email address associated with your account and a statement that you reside in California. We will make sure the data is not publicly displayed on the Services, but please be aware that the data may not be completely or comprehensively removed from all our systems (e.g., backups, etc.)."
            ]
        },
        {
            title: "Do We Make Updates to This Notice?",
            content: [
                "In Short: Yes, we will update this notice as necessary to stay compliant with relevant laws.",
                "We may update this privacy notice from time to time. The updated version will be indicated by an updated \"Revised\" date and the updated version will be effective as soon as it is accessible. If we make material changes to this privacy notice, we may notify you either by prominently posting a notice of such changes or by directly sending you a notification. We encourage you to review this privacy notice frequently to be informed of how we are protecting your information."
            ]
        },
        {
            title: "How Can You Contact Us About This Notice?",
            content: [
                "If you have questions or comments about this notice, you may email us at championfootballer@outlook.com or by post to:",
                "First Floor",
                "85 Great Portland St,",
                "London, England,",
                "W1W 7LL"
            ]
        },
        {
            title: "How Can You Review, Update, or Delete The Data We Collect From You?",
            content: [
                "Based on the applicable laws of your country, you may have the right to request access to the personal information we collect from you, change that information, or delete it. To request to review, update, or delete your personal information, please submit a request by using the contact form on the website: championfootballer.com"
            ]
        },
        {
            title: "Cookie Policy",
            content: [
                "Last updated August 22, 2022",
                "This Cookie Policy explains how Champion Footballer uses cookies and similar technologies to recognize you when you visit our websites at https://championfootballer.com/ (Websites). It explains what these technologies are and why we use them, as well as your rights to control our use of them.",
                "In some cases we may use cookies to collect personal information, or that becomes personal information if we combine it with other information.",
                "What are cookies?",
                "Cookies are small data files that are placed on your computer or mobile device when you visit a website. Cookies are widely used by website owners in order to make their websites work, or to work more efficiently, as well as to provide reporting information.",
                "Cookies set by the website owner (in this case, Champion Footballer) are called \"first party cookies\". Cookies set by parties other than the website owner are called \"third party cookies\". Third party cookies enable third party features or functionality to be provided on or through the website (e.g. like advertising, interactive content and analytics). The parties that set these third party cookies can recognize your computer both when it visits the website in question and also when it visits certain other websites.",
                "Why do we use cookies?",
                "We use first and third party cookies for several reasons. Some cookies are required for technical reasons in order for our Websites to operate, and we refer to these as \"essential\" or \"strictly necessary\" cookies. Other cookies also enable us to track and target the interests of our users to enhance the experience on our Online Properties. Third parties serve cookies through our Websites for advertising, analytics and other purposes. This is described in more detail below.",
                "The specific types of first and third party cookies served through our Websites and the purposes they perform are described below (please note that the specific cookies served may vary depending on the specific Online Properties you visit):",
                "How can I control cookies?",
                "You have the right to decide whether to accept or reject cookies. You can exercise your cookie rights by setting your preferences in the Cookie Consent Manager. The Cookie Consent Manager allows you to select which categories of cookies you accept or reject. Essential cookies cannot be rejected as they are strictly necessary to provide you with services.",
                "The Cookie Consent Manager can be found in the notification banner and on our website. If you choose to reject cookies, you may still use our website though your access to some functionality and areas of our website may be restricted. You may also set or amend your web browser controls to accept or refuse cookies. As the means by which you can refuse cookies through your web browser controls vary from browser-to-browser, you should visit your browser's help menu for more information.",
                "In addition, most advertising networks offer you a way to opt out of targeted advertising. If you would like to find out more information, please visit http://www.aboutads.info/choices/ or http://www.youronlinechoices.com/.",
                "The specific types of first and third party cookies served through our Websites and the purposes they perform are described in the table below (please note that the specific cookies served may vary depending on the specific Online Properties you visit):",
                "Essential website cookies:",
                "These cookies are strictly necessary to provide you with services available through our Websites and to use some of its features, such as access to secure areas.",
                "What about other tracking technologies, like web beacons?",
                "Cookies are not the only way to recognize or track visitors to a website. We may use other, similar technologies from time to time, like web beacons (sometimes called \"tracking pixels\" or \"clear gifs\"). These are tiny graphics files that contain a unique identifier that enable us to recognize when someone has visited our Websites or opened an e-mail including them. This allows us, for example, to monitor the traffic patterns of users from one page within a website to another, to deliver or communicate with cookies, to understand whether you have come to the website from an online advertisement displayed on a third-party website, to improve site performance, and to measure the success of e-mail marketing campaigns. In many instances, these technologies are reliant on cookies to function properly, and so declining cookies will impair their functioning.",
                "Do you use Flash cookies or Local Shared Objects?",
                "Websites may also use so-called \"Flash Cookies\" (also known as Local Shared Objects or \"LSOs\") to, among other things, collect and store information about your use of our services, fraud prevention and for other site operations.",
                "If you do not want Flash Cookies stored on your computer, you can adjust the settings of your Flash player to block Flash Cookies storage using the tools contained in the Website Storage Settings Panel. You can also control Flash Cookies by going to the Global Storage Settings Panel and following the instructions (which may include instructions that explain, for example, how to delete existing Flash Cookies (referred to \"information\" on the Macromedia site), how to prevent Flash LSOs from being placed on your computer without your being asked, and (for Flash Player 8 and later) how to block Flash Cookies that are not being delivered by the operator of the page you are on at the time).",
                "Please note that setting the Flash Player to restrict or limit acceptance of Flash Cookies may reduce or impede the functionality of some Flash applications, including, potentially, Flash applications used in connection with our services or online content.",
                "Do you serve targeted advertising?",
                "Third parties may serve cookies on your computer or mobile device to serve advertising through our Websites. These companies may use information about your visits to this and other websites in order to provide relevant advertisements about goods and services that you may be interested in. They may also employ technology that is used to measure the effectiveness of advertisements. This can be accomplished by them using cookies or web beacons to collect information about your visits to this and other sites in order to provide relevant advertisements about goods and services of potential interest to you. The information collected through this process does not enable us or them to identify your name, contact details or other details that directly identify you unless you choose to provide these.",
                "How often will you update this Cookie Policy?",
                "We may update this Cookie Policy from time to time in order to reflect, for example, changes to the cookies we use or for other operational, legal or regulatory reasons. Please therefore re-visit this Cookie Policy regularly to stay informed about our use of cookies and related technologies.",
                "The date at the top of this Cookie Policy indicates when it was last updated.",
                "Where can I get further information?",
                "If you have any questions about our use of cookies or other technologies, please email us at championfootballer@outlook.com or by post to:",
                "Champion Footballer",
                "First Floor",
                "85 Great Portland St,",
                "London, England,",
                "W1W 7LL"
            ]
        }
    ];

    const renderContent = (content: (string | string[])[]) => {
        return content.map((item, index) => {
            if (Array.isArray(item)) {
                return (
                    <List key={index} sx={{ pl: 2 }}>
                        {item.map((listItem, listIndex) => (
                            <ListItem key={listIndex} sx={{ display: 'list-item', pl: 1 }}>
                                <ListItemText primary={listItem} />
                            </ListItem>
                        ))}
                    </List>
                );
            } else {
                return (
                    <Typography key={index} variant="body1" sx={{ mb: 2, lineHeight: 1.6 }}>
                        {item}
                    </Typography>
                );
            }
        });
    };

  return (
        <Box sx={{ p: 6, bgcolor: '#d6ffd1', minHeight: '100vh' }}>
            <Typography variant="h3" sx={{ mb: 5, fontWeight: 600, color: '#1f673b' }}>
                Privacy Policy
            </Typography>
            <Typography variant="body1" sx={{ mb: 3, fontWeight: 600 }}>
                Last updated August 22, 2022
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {sections.map((section, index) => (
                    <Accordion
                        key={index}
                        expanded={expanded === `panel${index}`}
                        onChange={handleChange(`panel${index}`)}
                        sx={{
                            '&:before': { display: 'none' },
                            boxShadow: 2,
                            borderRadius: 2,
                            overflow: 'hidden',
                        }}
                    >
                        <AccordionSummary
                            expandIcon={<ExpandMoreIcon />}
                            sx={{
                                bgcolor: '#1f673b',
                                color: 'white',
                                borderRadius: 2,
                                '&:hover': {
                                    bgcolor: '#388e3c',
                                },
                                '&.Mui-expanded': {
                                    borderBottomLeftRadius: 0,
                                    borderBottomRightRadius: 0,
                                },
                            }}
                        >
                            <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                {section.title}
                            </Typography>
                        </AccordionSummary>
                        <AccordionDetails sx={{ bgcolor: 'white', p: 3 }}>
                            {renderContent(section.content)}
                        </AccordionDetails>
                    </Accordion>
                ))}
            </Box>
        </Box>
    );
}

export default PrivacyPolicies;
