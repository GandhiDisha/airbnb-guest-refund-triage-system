
Problem Statement - 
A guest messages Airbnb during or right after a stay: the AC didn't work, the unit was dirty, an advertised amenity wasn't there. Airbnb has to decide fast — full refund, partial refund, or deny the claim — and both sides have something real at stake. Grant refunds too easily and hosts lose income on stays that may have been fine, and eventually stop trusting the platform to have their side. Deny too readily and guests feel cheated, leave a bad review, or just stop booking through Airbnb.

The same complaint can mean very different things. "The AC didn't work" could mean it was genuinely broken the whole stay — and the guest mentioned it in the in-stay message thread, and the host's own maintenance log shows a ticket. Or it could mean the guest never figured out how to use it, and no other guest in the last twenty stays has said a word about that unit's AC. Or it could be a guest who had a perfectly fine stay and files a complaint on checkout day, having said nothing during the stay, hoping for a discount. Telling these apart means reading the in-stay message thread (did they raise it when it was happening, or only after checkout), checking what the listing actually promises or disclaims, checking whether other recent guests of the same unit mention the same issue, and checking whether this particular guest has a pattern of filing this kind of complaint.

Solution - 
Build a web tool with a user interface where an airbnb support agent can give an input on a guest complaint and the system will analyse the complaint and suggest an appropriate refund amount if the refund should be given. The tool should also generate a neutral diplomatic response that the support agent can send to the guest and explain to them the decision on the refund.
Any tech stack can be used for this.

Input -
1. Status of Stay - ('Completed','Ongoing','Upcoming')
2. Category of Listing - ('Entire Property','Shared Room','Private Room')
3. Issue Category - ('Safety/Security','Amenities Missing','Inaccurate Listing','Cleanliness','Host Responsiveness')
4. Evidence of Claim - per guest response
5. No of days in the stay - per support agent response
6. Booking value USD - per support agent response
7. Host response time to guest - per support agent response
8. Triage Priority - ('High','Medium','Low')
9. guest Chat Logs - per support agent response

Output - 
Decision if the refund should be given or not 
Refund Amount if applicable
Response for the guest

Things to consider in making the decision -
The tool needs to understand the legitimacy of the complaint by looking at the the message thread, the listing description, other guest' review text, this guest's own complaint history.
The tool should not be biased in any way but always remember that guest retention is important for Airbnb and hence their satisfaction is very important.

what to analyse about the guest -
1. It needs to understand if the guest has made any fake complaints in the past. 
2. How long into the stay has the guest made the complaint and if the complaint makes sense at that stage or it should have been raised a little before or after.
3. Was the guest responsive 
4. How many complaints has the guest made in the past
5. Did the customer raise issues or inform of the grievance to the host

what to analyse about the host -
1. Responsiveness
2. Accuracy of all the listings they have
3. Have they received complaints in the past and how many
4. How do they respond to complaints. Are they attentive to customers
5. How elaborate are the listings
