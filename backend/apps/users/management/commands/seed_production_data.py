import secrets
from decimal import Decimal
from datetime import timedelta
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.utils import timezone

from apps.users.models import Role, SalesAgent
from apps.dealers.models import Dealer
from apps.distributors.models import Distributor, DistributorWallet, WalletLedgerEntry
from apps.products.models import Product, ProductPrice
from apps.orders.models import Order, OrderItem
from apps.payments.models import Payment
from apps.loading.models import Truck, Driver, LoadingBay, LoadingOperator, LoadingSession, WeighbridgeReading
from apps.dispatch.models import GatePass, Dispatch
from apps.claims.models import Claim, ClaimEvidence

User = get_user_model()

class Command(BaseCommand):
    help = "Seed authoritative BFEL Flow enterprise database with users, products, fleet, and pipeline orders."

    def handle(self, *args, **options):
        self.stdout.write("Starting BFEL FLOW enterprise database seed...")

        # 1. RBAC Roles
        roles_data = [
            (Role.Code.DEALER, "Dealer", "Rural retail feed dealer"),
            (Role.Code.DISTRIBUTOR, "Distributor", "Regional wholesale hub partner"),
            (Role.Code.SALES_AGENT, "Sales Agent", "BFEL field sales officer"),
            (Role.Code.ACCOUNTS, "Accounts", "Finance & accounts verification desk"),
            (Role.Code.LOADING_OPERATOR, "Loading Operator", "Plant weighbridge & bay loading operator"),
            (Role.Code.ADMIN, "Admin", "Central operations command executive"),
        ]
        roles = {}
        for code, name, desc in roles_data:
            role, _ = Role.objects.get_or_create(code=code, defaults={'name': name, 'description': desc})
            roles[code] = role
        self.stdout.write(self.style.SUCCESS(f"[OK] Seeded {len(roles)} RBAC roles."))

        # 2. Users
        def create_user(username, phone, email, role_code, first_name, last_name, org, territory='', is_staff=False, is_super=False):
            user, created = User.objects.get_or_create(
                phone=phone,
                defaults={
                    'username': username,
                    'email': email,
                    'role': roles[role_code],
                    'first_name': first_name,
                    'last_name': last_name,
                    'status': User.Status.ACTIVE,
                    'organization': org,
                    'territory': territory,
                    'is_staff': is_staff,
                    'is_superuser': is_super,
                }
            )
            user.set_password('Password123')
            user.save()
            return user

        dealer_user = create_user('ramesh.patel', '9826041290', 'ramesh.patel@patelagro.in', Role.Code.DEALER, 'Ramesh', 'Patel', 'Patel Agro Agency', 'Dewas Mandi Yard, MP')
        dist_user = create_user('sanjay.maheshwari', '9827033412', 'sanjay@malwaagrifeeds.com', Role.Code.DISTRIBUTOR, 'Sanjay', 'Maheshwari', 'Malwa Agri Feeds Pvt Ltd', 'Indore Central Hub, MP')
        agent_user = create_user('vikram.chauhan', '9425088219', 'vikram.chauhan@bfel.in', Role.Code.SALES_AGENT, 'Vikram', 'Chauhan', 'BFEL Field Sales - Malwa Region', 'Indore & Dewas Belt, MP')
        acc_user = create_user('sunita.jain', '9893077140', 'sunita.jain@bfel.in', Role.Code.ACCOUNTS, 'Sunita', 'Jain', 'BFEL Finance & Accounts Desk', 'Central Plant, Indore')
        loading_user = create_user('kailash.v', '9752019340', 'kailash.v@bfel.in', Role.Code.LOADING_OPERATOR, 'Kailash', 'Verma', 'Plant Dispatch Bay 3', 'Manglia Terminal, Indore')
        admin_user = create_user('operations.head', '9826100552', 'operations.head@bfel.in', Role.Code.ADMIN, 'Rajeshwar', 'Sharma', 'BFEL Operations Command Center', 'Headquarters, Indore, MP', is_staff=True, is_super=True)

        self.stdout.write(self.style.SUCCESS("[OK] Seeded 6 primary active operational users (Password123)."))

        # 3. Domain Profiles
        distributor, _ = Distributor.objects.get_or_create(
            user=dist_user,
            defaults={
                'company_name': 'Malwa Agri Feeds Pvt Ltd',
                'distributor_code': 'DIST-IND-01',
                'gstin': '23AABCM4412L1Z9',
                'warehouse_address': 'Warehouse Complex, Sanwer Road Industrial Area',
                'city': 'Indore',
                'district': 'Indore',
                'state': 'Madhya Pradesh',
            }
        )

        wallet, _ = DistributorWallet.objects.get_or_create(
            distributor=distributor,
            defaults={
                'credit_limit': Decimal('1500000.00'),
                'available_balance': Decimal('450000.00'),
                'reserved_funds': Decimal('0.00'),
            }
        )
        if not wallet.ledger_entries.exists():
            WalletLedgerEntry.objects.create(
                wallet=wallet,
                entry_type=WalletLedgerEntry.EntryType.CREDIT,
                amount=Decimal('450000.00'),
                balance_after=Decimal('450000.00'),
                reference='INIT-CREDIT-ALLOC',
                description='Opening approved credit headroom allocation',
            )

        sales_agent, _ = SalesAgent.objects.get_or_create(
            user=agent_user,
            defaults={
                'employee_id': 'BFEL-EMP-842',
                'region': 'Indore & Dewas Belt, MP',
                'reporting_manager': 'Rajeshwar Sharma',
            }
        )

        dealer, _ = Dealer.objects.get_or_create(
            user=dealer_user,
            defaults={
                'dealership_name': 'Patel Agro Agency',
                'gstin': '23AABCP8921M1Z4',
                'mandi_yard': 'Dewas Mandi Yard, MP',
                'address': 'Shop 14-16, Mandi Parisar, Dewas',
                'city': 'Dewas',
                'district': 'Dewas',
                'state': 'Madhya Pradesh',
                'pincode': '455001',
                'assigned_distributor': distributor,
                'assigned_sales_agent': sales_agent,
            }
        )

        loading_op, _ = LoadingOperator.objects.get_or_create(
            user=loading_user,
            defaults={'employee_id': 'BFEL-OPS-512'}
        )
        self.stdout.write(self.style.SUCCESS("[OK] Seeded Domain Profiles (Dealer, Distributor, Wallet, Sales Agent, Loading Operator)."))

        # 4. Products Catalog (Standard 50 kg bags)
        products_info = [
            ('BFEL-DD-50', 'BFEL Dudh Dhara 50kg', Decimal('20.00'), Decimal('4.00'), Decimal('1420.00')),
            ('BFEL-PPU-50', 'BFEL Pashu Poshan Ultra 50kg', Decimal('18.00'), Decimal('3.50'), Decimal('1380.00')),
            ('BFEL-SDP-50', 'BFEL Sampurna Doodh Plus 50kg', Decimal('22.00'), Decimal('4.50'), Decimal('1460.00')),
            ('BFEL-CS-50', 'BFEL Calf Starter Balanced 50kg', Decimal('24.00'), Decimal('5.00'), Decimal('1580.00')),
            ('BFEL-HGP-50', 'BFEL Heifer Grow Pro 50kg', Decimal('16.00'), Decimal('3.00'), Decimal('1340.00')),
            ('BFEL-BSL-50', 'BFEL Buffalo Special Lacto 50kg', Decimal('21.00'), Decimal('6.50'), Decimal('1490.00')),
        ]
        products = {}
        for sku, name, protein, fat, price in products_info:
            prod, _ = Product.objects.get_or_create(
                sku=sku,
                defaults={
                    'name': name,
                    'category': 'Cattle Feed',
                    'bag_weight_kg': 50,
                    'protein_percent': protein,
                    'fat_percent': fat,
                    'is_active': True,
                }
            )
            ProductPrice.objects.get_or_create(
                product=prod,
                is_active=True,
                defaults={'price_per_bag': price}
            )
            products[sku] = prod
        self.stdout.write(self.style.SUCCESS(f"[OK] Seeded {len(products)} 50kg Cattle Feed Products with Active Pricing."))

        # 5. Fleet & Loading Bays
        trucks_info = [
            ('MP-09-GH-4120', Truck.CapacityType.CAPACITY_20_MT, 400, Decimal('20.00')),
            ('MP-09-KA-8812', Truck.CapacityType.CAPACITY_25_MT, 500, Decimal('25.00')),
            ('MP-13-ZB-6104', Truck.CapacityType.CAPACITY_20_MT, 400, Decimal('20.00')),
            ('MP-09-LN-9921', Truck.CapacityType.CAPACITY_25_MT, 500, Decimal('25.00')),
        ]
        trucks = {}
        for reg, cap, max_b, cap_mt in trucks_info:
            tr, _ = Truck.objects.get_or_create(
                registration_number=reg,
                defaults={
                    'capacity_type': cap,
                    'max_bags': max_b,
                    'capacity_mt': cap_mt,
                    'is_active': True,
                }
            )
            trucks[reg] = tr

        drivers_info = [
            ('Ramdas Gurjar', 'MP-09-2018-00918', '9826112341'),
            ('Sukhwinder Singh', 'PB-10-2015-88219', '9425081277'),
            ('Manoj Solanki', 'MP-13-2020-00142', '9752044819'),
        ]
        drivers = {}
        for dname, dlic, dphone in drivers_info:
            dr, _ = Driver.objects.get_or_create(
                license_number=dlic,
                defaults={'name': dname, 'phone': dphone, 'is_active': True}
            )
            drivers[dname] = dr

        bays_info = [
            ('BAY-01', 'Bay 01 - Heavy 20 MT Conveyor'),
            ('BAY-02', 'Bay 02 - Bulk 25 MT Hydraulic Bay'),
            ('BAY-03', 'Bay 03 - Multi-grade Express Bay'),
        ]
        bays = {}
        for bnum, bname in bays_info:
            bay, _ = LoadingBay.objects.get_or_create(
                bay_number=bnum,
                defaults={'name': bname, 'is_active': True}
            )
            bays[bnum] = bay
        self.stdout.write(self.style.SUCCESS("[OK] Seeded Fleet (Trucks, Drivers, Loading Bays)."))

        # 6. Pipeline Orders
        p_dd = products['BFEL-DD-50']
        p_ppu = products['BFEL-PPU-50']

        # Order 1: PAYMENT_PENDING (400 bags = 20 MT)
        o1, _ = Order.objects.get_or_create(
            order_number='ORD-2026-1001',
            defaults={
                'dealer': dealer,
                'distributor': distributor,
                'truck_capacity': Order.TruckCapacity.CAPACITY_20_MT,
                'max_bags': 400,
                'total_bags': 400,
                'total_weight_kg': Decimal('20000.00'),
                'total_weight_mt': Decimal('20.000'),
                'subtotal': Decimal('568000.00'),
                'discount': Decimal('0.00'),
                'net_total': Decimal('568000.00'),
                'advance_payable': Decimal('568000.00'),
                'advance_paid': Decimal('0.00'),
                'destination': 'Patel Agro Godown, Dewas Mandi Yard',
                'status': Order.Status.PAYMENT_PENDING,
                'created_by': dealer_user,
            }
        )
        if not o1.items.exists():
            OrderItem.objects.create(
                order=o1, product=p_dd, bags=400, bag_weight_kg=50,
                weight_kg=Decimal('20000.00'), weight_mt=Decimal('20.000'),
                rate_per_bag=Decimal('1420.00'), total_amount=Decimal('568000.00')
            )

        # Order 2: PAYMENT_SUBMITTED (500 bags = 25 MT, payment awaiting accounts verification)
        o2, _ = Order.objects.get_or_create(
            order_number='ORD-2026-1002',
            defaults={
                'dealer': dealer,
                'distributor': distributor,
                'truck_capacity': Order.TruckCapacity.CAPACITY_25_MT,
                'max_bags': 500,
                'total_bags': 500,
                'total_weight_kg': Decimal('25000.00'),
                'total_weight_mt': Decimal('25.000'),
                'subtotal': Decimal('690000.00'),
                'discount': Decimal('0.00'),
                'net_total': Decimal('690000.00'),
                'advance_payable': Decimal('690000.00'),
                'advance_paid': Decimal('0.00'),
                'destination': 'Patel Agro Godown, Dewas Mandi Yard',
                'status': Order.Status.PAYMENT_SUBMITTED,
                'created_by': dealer_user,
            }
        )
        if not o2.items.exists():
            OrderItem.objects.create(
                order=o2, product=p_ppu, bags=500, bag_weight_kg=50,
                weight_kg=Decimal('25000.00'), weight_mt=Decimal('25.000'),
                rate_per_bag=Decimal('1380.00'), total_amount=Decimal('690000.00')
            )
            Payment.objects.get_or_create(
                order=o2,
                defaults={
                    'dealer': dealer,
                    'amount': Decimal('690000.00'),
                    'payment_mode': Payment.Mode.RTGS,
                    'utr_number': 'HDFC8841920042',
                    'bank_name': 'HDFC Bank, Dewas Branch',
                    'submitted_by': dealer_user,
                    'status': Payment.Status.PENDING,
                }
            )

        # Order 3: PAYMENT_VERIFIED / LOADING_QUEUED (400 bags = 20 MT)
        o3, _ = Order.objects.get_or_create(
            order_number='ORD-2026-1003',
            defaults={
                'dealer': dealer,
                'distributor': distributor,
                'truck_capacity': Order.TruckCapacity.CAPACITY_20_MT,
                'max_bags': 400,
                'total_bags': 400,
                'total_weight_kg': Decimal('20000.00'),
                'total_weight_mt': Decimal('20.000'),
                'subtotal': Decimal('568000.00'),
                'discount': Decimal('0.00'),
                'net_total': Decimal('568000.00'),
                'advance_payable': Decimal('568000.00'),
                'advance_paid': Decimal('568000.00'),
                'destination': 'Patel Agro Godown, Dewas Mandi Yard',
                'status': Order.Status.LOADING_QUEUED,
                'created_by': dealer_user,
            }
        )
        if not o3.items.exists():
            OrderItem.objects.create(
                order=o3, product=p_dd, bags=400, bag_weight_kg=50,
                weight_kg=Decimal('20000.00'), weight_mt=Decimal('20.000'),
                rate_per_bag=Decimal('1420.00'), total_amount=Decimal('568000.00')
            )
            Payment.objects.get_or_create(
                order=o3,
                defaults={
                    'dealer': dealer,
                    'amount': Decimal('568000.00'),
                    'payment_mode': Payment.Mode.NEFT,
                    'utr_number': 'SBIN0041289912',
                    'bank_name': 'State Bank of India',
                    'submitted_by': dealer_user,
                    'verified_by': acc_user,
                    'status': Payment.Status.VERIFIED,
                }
            )

        # Order 4: LOADING in Progress (Bay 1)
        o4, _ = Order.objects.get_or_create(
            order_number='ORD-2026-1004',
            defaults={
                'dealer': dealer,
                'distributor': distributor,
                'truck_capacity': Order.TruckCapacity.CAPACITY_20_MT,
                'max_bags': 400,
                'total_bags': 400,
                'total_weight_kg': Decimal('20000.00'),
                'total_weight_mt': Decimal('20.000'),
                'subtotal': Decimal('568000.00'),
                'discount': Decimal('0.00'),
                'net_total': Decimal('568000.00'),
                'advance_payable': Decimal('568000.00'),
                'advance_paid': Decimal('568000.00'),
                'destination': 'Patel Agro Godown, Dewas Mandi Yard',
                'status': Order.Status.LOADING,
                'created_by': dealer_user,
            }
        )
        if not o4.items.exists():
            OrderItem.objects.create(
                order=o4, product=p_dd, bags=400, bag_weight_kg=50,
                weight_kg=Decimal('20000.00'), weight_mt=Decimal('20.000'),
                rate_per_bag=Decimal('1420.00'), total_amount=Decimal('568000.00')
            )
            Payment.objects.get_or_create(
                order=o4,
                defaults={
                    'dealer': dealer,
                    'amount': Decimal('568000.00'),
                    'payment_mode': Payment.Mode.RTGS,
                    'utr_number': 'ICIC9912884102',
                    'bank_name': 'ICICI Bank',
                    'submitted_by': dealer_user,
                    'verified_by': acc_user,
                    'status': Payment.Status.VERIFIED,
                }
            )
            LoadingSession.objects.get_or_create(
                order=o4,
                defaults={
                    'truck': trucks['MP-09-GH-4120'],
                    'bay': bays['BAY-01'],
                    'driver': drivers['Ramdas Gurjar'],
                    'operator': loading_op,
                    'expected_bags': 400,
                    'bags_loaded': 240,
                    'status': LoadingSession.Status.IN_PROGRESS,
                }
            )

        # Order 5: DISPATCHED (500 bags = 25 MT, gate pass issued, on road)
        o5, _ = Order.objects.get_or_create(
            order_number='ORD-2026-1005',
            defaults={
                'dealer': dealer,
                'distributor': distributor,
                'truck_capacity': Order.TruckCapacity.CAPACITY_25_MT,
                'max_bags': 500,
                'total_bags': 500,
                'total_weight_kg': Decimal('25000.00'),
                'total_weight_mt': Decimal('25.000'),
                'subtotal': Decimal('690000.00'),
                'discount': Decimal('0.00'),
                'net_total': Decimal('690000.00'),
                'advance_payable': Decimal('690000.00'),
                'advance_paid': Decimal('690000.00'),
                'destination': 'Patel Agro Godown, Dewas Mandi Yard',
                'status': Order.Status.DISPATCHED,
                'created_by': dealer_user,
            }
        )
        if not o5.items.exists():
            OrderItem.objects.create(
                order=o5, product=p_ppu, bags=500, bag_weight_kg=50,
                weight_kg=Decimal('25000.00'), weight_mt=Decimal('25.000'),
                rate_per_bag=Decimal('1380.00'), total_amount=Decimal('690000.00')
            )
            Payment.objects.get_or_create(
                order=o5,
                defaults={
                    'dealer': dealer,
                    'amount': Decimal('690000.00'),
                    'payment_mode': Payment.Mode.RTGS,
                    'utr_number': 'AXIS0019284192',
                    'bank_name': 'Axis Bank',
                    'submitted_by': dealer_user,
                    'verified_by': acc_user,
                    'status': Payment.Status.VERIFIED,
                }
            )
            ls5, _ = LoadingSession.objects.get_or_create(
                order=o5,
                defaults={
                    'truck': trucks['MP-09-KA-8812'],
                    'bay': bays['BAY-02'],
                    'driver': drivers['Sukhwinder Singh'],
                    'operator': loading_op,
                    'expected_bags': 500,
                    'bags_loaded': 500,
                    'status': LoadingSession.Status.COMPLETED,
                }
            )
            WeighbridgeReading.objects.get_or_create(
                session=ls5,
                defaults={
                    'tare_weight_kg': Decimal('8100.00'),
                    'gross_weight_kg': Decimal('33100.00'),
                    'net_weight_kg': Decimal('25000.00'),
                    'expected_weight_kg': Decimal('25000.00'),
                    'variance_kg': Decimal('0.00'),
                    'operator': loading_user,
                }
            )
            gp5, _ = GatePass.objects.get_or_create(
                order=o5,
                defaults={
                    'gate_pass_number': 'GP-2026-09941',
                    'truck': trucks['MP-09-KA-8812'],
                    'driver': drivers['Sukhwinder Singh'],
                    'seal_number': 'BFEL-SEAL-88412',
                }
            )
            Dispatch.objects.get_or_create(
                order=o5,
                defaults={
                    'dispatch_number': 'DSP-2026-1005-01',
                    'gate_pass': gp5,
                    'truck': trucks['MP-09-KA-8812'],
                    'driver': drivers['Sukhwinder Singh'],
                    'destination': o5.destination,
                    'lr_number': 'LR-IND-99410',
                    'status': Dispatch.Status.IN_TRANSIT,
                }
            )

        # Order 6: DELIVERED with Active Shortage Claim (400 bags = 20 MT)
        o6, _ = Order.objects.get_or_create(
            order_number='ORD-2026-1006',
            defaults={
                'dealer': dealer,
                'distributor': distributor,
                'truck_capacity': Order.TruckCapacity.CAPACITY_20_MT,
                'max_bags': 400,
                'total_bags': 400,
                'total_weight_kg': Decimal('20000.00'),
                'total_weight_mt': Decimal('20.000'),
                'subtotal': Decimal('568000.00'),
                'discount': Decimal('0.00'),
                'net_total': Decimal('568000.00'),
                'advance_payable': Decimal('568000.00'),
                'advance_paid': Decimal('568000.00'),
                'destination': 'Patel Agro Godown, Dewas Mandi Yard',
                'status': Order.Status.DELIVERED,
                'created_by': dealer_user,
            }
        )
        if not o6.items.exists():
            OrderItem.objects.create(
                order=o6, product=p_dd, bags=400, bag_weight_kg=50,
                weight_kg=Decimal('20000.00'), weight_mt=Decimal('20.000'),
                rate_per_bag=Decimal('1420.00'), total_amount=Decimal('568000.00')
            )
            Payment.objects.get_or_create(
                order=o6,
                defaults={
                    'dealer': dealer,
                    'amount': Decimal('568000.00'),
                    'payment_mode': Payment.Mode.RTGS,
                    'utr_number': 'PUNB9941209412',
                    'bank_name': 'Punjab National Bank',
                    'submitted_by': dealer_user,
                    'verified_by': acc_user,
                    'status': Payment.Status.VERIFIED,
                }
            )
            # Create a claim
            Claim.objects.get_or_create(
                claim_number='CLM-2026-00412',
                defaults={
                    'order': o6,
                    'dealer': dealer,
                    'claim_type': Claim.ClaimType.SHORTAGE,
                    'affected_bags': 12,
                    'expected_bags': 400,
                    'received_bags': 388,
                    'shortage_bags': 12,
                    'shortage_weight_kg': Decimal('600.00'),
                    'description': 'Consignment received with 12 bags shortage against gate pass count 400. Godown unloading physical recount verified.',
                    'status': Claim.Status.CREATED,
                    'created_by': dealer_user,
                }
            )

        self.stdout.write(self.style.SUCCESS("[OK] Seeded 6 comprehensive pipeline orders matching all ERP lifecycle stages."))
        self.stdout.write(self.style.SUCCESS("=================================================================="))
        self.stdout.write(self.style.SUCCESS("BFEL FLOW ENTERPRISE DATABASE SEEDED SUCCESSFULLY!"))
        self.stdout.write(self.style.SUCCESS("=================================================================="))
